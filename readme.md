# Changes (in) Coverage Check Action
This action will use your testing coverage report JSON to check coverage on changes made in on a branch and automatically find lines which are not present in the coverage report (this means probablly that it's not covered with a test).
A markdown file with the results will be generated so this can be used (with for ex. sticky-pull-request-comment to post an PR comment). Tested with Vitest (c8) coverage report (full report, so not the summary)

## Inputs

| Input | Description | Default |
| --- | --- | --- |
| working-directory | Base path for input files and artifacts | /home/runner | 

## Example job
```yaml
test:
    ....
    -   name: ➕ Create diff
        run: |
            git diff -U0 origin/${{ github.event.pull_request.base.ref }}...HEAD --output /home/runner/diff

    -   name: 🖌️ Check Coverage
        uses: rvanmarkus/changes-coverage-check-action
        with:
            working-directory: /home/runner

    -   name: 📈 Publish coverage report
        uses: marocchino/sticky-pull-request-comment@44ff4b00ca3727f18157a7271244078ff85ff610
        with:
            recreate: true
            path: /home/runner/coverage-comment.md


```