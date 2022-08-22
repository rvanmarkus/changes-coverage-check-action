import { getInput, setFailed } from "@actions/core";
import fs from "fs";
import path from "path";
import { env } from "process";
import { CoverageReport, determineFilesWithoutCoverage } from "./filesWithoutCoverage";

const defaultCoverageReportFile = getInput("coverage-report-file",  { required: false });
const defaultMarkdownFile = getInput("markdown-output-file",  { required: false });
const defaultDiffFile = getInput("diff-file",  { required: false });
const defaultPrefix = getInput("prefix-coverage-report-files",  { required: false });

const basePathInput = getInput("working-directory", { required: false });
const basePath = basePathInput === "" ? env.GITHUB_WORKSPACE! : basePathInput;

console.log("Running with parameters:")
console.log(`coverage-report-file: ${defaultCoverageReportFile}`)
console.log(`markdown-output-file: ${defaultMarkdownFile}`)
console.log(`diff-file: ${defaultDiffFile}`)
console.log(`prefix-coverage-report-files: ${defaultPrefix}`)
console.log(`working-directory: ${basePath}`)

try {
    run();
} catch (error: any) {
    setFailed(error.message);
}

async function run() {
    const diff = getDiff();
    const coverageReport: CoverageReport = require(path.join(
        basePath,
        defaultCoverageReportFile
    ));

    const filesWithoutCoverage = determineFilesWithoutCoverage(defaultPrefix, diff, coverageReport);

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

function getDiff() {
    return fs
        .readFileSync(path.join(basePath, defaultDiffFile))
        .toString();
}

function writeMarkdown(content: string) {
    fs.writeFileSync(path.join(basePath, defaultMarkdownFile), content);
}
