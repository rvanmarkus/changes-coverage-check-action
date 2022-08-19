"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.determineFilesWithoutCoverage = void 0;
const parse_diff_1 = __importDefault(require("parse-diff"));
const path_1 = __importDefault(require("path"));
function transformFilenameInCoverageReport(prefix, filename) {
    return path_1.default.join(prefix, filename);
}
function determineFilesWithoutCoverage(filePrefix, diffString, coverageReport) {
    const diff = (0, parse_diff_1.default)(diffString);
    const filesWithUncoveredLines = new Map(Object.values(coverageReport).map((file) => [
        transformFilenameInCoverageReport(filePrefix, file.path),
        Object.keys(file.s)
            .filter((key) => file.s[key] == 0)
            .map((key) => Number(key))
            .map((n) => n + 1),
    ]));
    const files = filesThatNeedCoverage(diff, filesWithUncoveredLines);
    return files.reduce((acc, file) => {
        const uncoverdLines = filesWithUncoveredLines.get(file.fileName);
        if (!uncoverdLines) {
            throw Error(`File not un coverage report: ${file.fileName}`);
        }
        let uncoveredChangesLines = file.changedLines.filter((n) => uncoverdLines.includes(n));
        if (uncoveredChangesLines.length === 0) {
            return acc;
        }
        acc.push([file.fileName, uncoveredChangesLines]);
        return acc;
    }, []);
}
exports.determineFilesWithoutCoverage = determineFilesWithoutCoverage;
function filesThatNeedCoverage(diff, coverage) {
    const modifiedFiles = diff
        .filter((file) => !file.deleted)
        .map((file) => ({
        name: file.to,
        changes: file.chunks.flatMap((chunk) => chunk.changes.filter((change) => change.type === "add")),
    }));
    const [filesThatNeedCoverage, filesThatDoNotNeedCoverage] = modifiedFiles.reduce(([needCoverage, doNot], file) => {
        if (coverage.has(file.name)) {
            needCoverage.push(file);
        }
        else {
            doNot.push(file);
        }
        return [needCoverage, doNot];
    }, [[], []]);
    filesThatDoNotNeedCoverage.forEach((noCoverageNeeded) => console.log(`No file found with coverage: ${noCoverageNeeded.name}`));
    return filesThatNeedCoverage.map((file) => ({
        fileName: file.name,
        changedLines: file.changes.map((change) => change.ln),
    }));
}
