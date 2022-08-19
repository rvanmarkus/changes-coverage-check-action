import { getInput, setFailed } from "@actions/core";
import fs from "fs";
import parseDiff, { AddChange } from "parse-diff";
import path from "path";

const defaultCoverageReportFile = "coverage-final.json";
const defaultMarkdownFile = "coverage-comment.md";
const defaultDiffFile = "diff";
const defaultPrefix = "services/portal"; // Very portal specific atm
const basePath = getInput("working-directory", { required: true });


try {
    run();
} catch (error: any) {
    setFailed(error.message);
}

type CoverageReport = {
    [key: string]: {
        path: string;
        s: {
            [key: string]: number;
        };
    };
};
async function run() {
    const diff = getDiff();

    const coverageReport: CoverageReport = require(path.join(
        basePath,
        defaultCoverageReportFile
    ));

    const filesWithUncoveredLines = new Map(
        Object.values(coverageReport).map((file) => [
            transformFilenameInCoverageReport(file.path),
            Object.keys(file.s)
                .filter((key) => file.s[key] == 0)
                .map((key) => Number(key))
                .map((n) => n + 1),
        ])
    );

    const files = filesThatNeedCoverage(diff, filesWithUncoveredLines);

    const filesWithoutCoverage = files.reduce((acc, file) => {
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
    if (filesWithoutCoverage.length === 0) {
        writeMarkdown(`
# FE-Coverage
> ✅ Coverage is a-ok 👌
        `);
        return;
    }

    writeMarkdown(`
# FE-Coverage
> ❌ Oops some files are lacking test coverage, please improve:

File | Lines uncoverage
--- | ---
${filesWithoutCoverage
    .map((file) => `${file[0]} | [${file[1].join(", ")}]`)
    .join("\n")}
        `);
}

function transformFilenameInCoverageReport(filename: string) {
    return path.join(defaultPrefix, filename);
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

function getDiff() {
    const diffString: string = fs
        .readFileSync(path.join(basePath, defaultDiffFile))
        .toString();
    return parseDiff(diffString);
}

function writeMarkdown(content: string) {
    fs.writeFileSync(path.join(basePath, defaultMarkdownFile), content);
}
