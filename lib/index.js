"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@actions/core");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const filesWithoutCoverage_1 = require("./filesWithoutCoverage");
const defaultCoverageReportFile = "coverage-final.json";
const defaultMarkdownFile = "coverage-comment.md";
const defaultDiffFile = "diff";
const defaultPrefix = "services/portal"; // Very portal specific atm
const basePath = (0, core_1.getInput)("working-directory", { required: true });
try {
    run();
}
catch (error) {
    (0, core_1.setFailed)(error.message);
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const diff = getDiff();
        const coverageReport = require(path_1.default.join(basePath, defaultCoverageReportFile));
        const filesWithoutCoverage = (0, filesWithoutCoverage_1.determineFilesWithoutCoverage)(defaultPrefix, diff, coverageReport);
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
    });
}
function getDiff() {
    return fs_1.default
        .readFileSync(path_1.default.join(basePath, defaultDiffFile))
        .toString();
}
function writeMarkdown(content) {
    fs_1.default.writeFileSync(path_1.default.join(basePath, defaultMarkdownFile), content);
}
