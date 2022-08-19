import parseDiff, { AddChange } from "parse-diff";
import path from "path";

export type CoverageReport = {
    [key: string]: {
        path: string;
        s: {
            [key: string]: number;
        };
    };
};

function transformFilenameInCoverageReport(prefix: string, filename: string) {
    return path.join(prefix, filename);
}

export function determineFilesWithoutCoverage(filePrefix: string, diffString: string, coverageReport: CoverageReport) {
    const diff = parseDiff(diffString);

    const filesWithUncoveredLines = new Map(
        Object.values(coverageReport).map((file) => [
            transformFilenameInCoverageReport(filePrefix, file.path),
            Object.keys(file.s)
                .filter((key) => file.s[key] == 0)
                .map((key) => Number(key))
                .map((n) => n + 1),
        ])
    );

    const files = filesThatNeedCoverage(diff, filesWithUncoveredLines);

    return files.reduce((acc, file) => {
        const uncoverdLines = filesWithUncoveredLines.get(file.fileName);

        if (!uncoverdLines) {
            throw Error(`File not un coverage report: ${file.fileName}`);
        }

        let uncoveredChangesLines = file.changedLines.filter((n) =>
            uncoverdLines.includes(n)
        );

        if (uncoveredChangesLines.length === 0) {
            return acc;
        }

        acc.push([file.fileName, uncoveredChangesLines]);
        return acc;
    }, [] as [string, number[]][]);
}

function filesThatNeedCoverage(
    diff: parseDiff.File[],
    coverage: Map<string, number[]>
) {
    const modifiedFiles = diff
        .filter((file) => !file.deleted)
        .map((file) => ({
            name: file.to!,
            changes: file.chunks.flatMap(
                (chunk) =>
                    chunk.changes.filter(
                        (change) => change.type === "add"
                    ) as AddChange[]
            ),
        }));

    const [filesThatNeedCoverage, filesThatDoNotNeedCoverage] =
        modifiedFiles.reduce(
            ([needCoverage, doNot], file) => {
                if (coverage.has(file.name)) {
                    needCoverage.push(file);
                } else {
                    doNot.push(file);
                    console.log(6);
                }
                return [needCoverage, doNot];
            },
            [[], []] as [typeof modifiedFiles, typeof modifiedFiles]
        );

    filesThatDoNotNeedCoverage.forEach((noCoverageNeeded) =>
        console.log(`No file found with coverage: ${noCoverageNeeded.name}`)
    );

    return filesThatNeedCoverage.map((file) => ({
        fileName: file.name,
        changedLines: file.changes.map((change) => change.ln),
    }));
}