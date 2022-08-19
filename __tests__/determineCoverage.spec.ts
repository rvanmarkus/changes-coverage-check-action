import { CoverageReport, determineFilesWithoutCoverage } from "../src/filesWithoutCoverage"

describe('coverage', () => {
    const createdFileDiff = `
new file mode 100644
index 0000000..38db6c0
--- /dev/null
+++ b/src/test.ts
@@ -0,0 +1,3 @@
+function test(wat: boolean) {
+    return wat ? 'fizz': 'buzz'
+}
\ No newline at end of file        
`

    it('Give no errors on covered line', () => {
        const coverage: CoverageReport = {
            'src/test.ts': {
                path: 'src/test.ts',
                s: {
                    "0": 1,
                    "2": 1,
                    "1": 1
                }
            }
        }
        const result = determineFilesWithoutCoverage('', createdFileDiff, coverage);
        expect(result).toEqual([]);
    })

    it('Report second line is not covered', () => {
        const coverage: CoverageReport = {
            'src/test.ts': {
                path: 'src/test.ts',
                s: {
                    "0": 1,
                    "1": 0,
                    "2": 1
                }
            }
        }
        const result = determineFilesWithoutCoverage('', createdFileDiff, coverage);
        expect(result).toEqual([['src/test.ts', [2]]]);
    })
}) 