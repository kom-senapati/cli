import { getCliTestFixture } from "../../fixtures/get-cli-test-fixture"
import { test, expect } from "bun:test"
import { join } from "node:path"
import { execSync } from "node:child_process"

test("init command installs @types/react and passes type-checking", async () => {
  const { tmpDir, runCommand } = await getCliTestFixture()

  const { stdout } = await runCommand("tsci init")
  console.log(stdout)

  const pkgJsonPath = join(tmpDir, "package.json")
  const pkgJson = JSON.parse(await Bun.file(pkgJsonPath).text())
  expect(pkgJson.devDependencies["@types/react"]).toBeDefined()
  expect(pkgJson.devDependencies["@tscircuit/core"]).toBeDefined()

  const npmrcPath = join(tmpDir, ".npmrc")
  const npmrcContent = await Bun.file(npmrcPath).text()
  expect(npmrcContent).toContain("@tsci:registry=https://npm.tscircuit.com")

  const tsconfigPath = join(tmpDir, "tsconfig.json")
  const tsconfigExists = await Bun.file(tsconfigPath).exists()
  expect(tsconfigExists).toBeTrue()

  try {
    const typeCheckResult = execSync("npx tsc --noEmit", {
      cwd: tmpDir,
      stdio: "pipe",
    })
    console.log(typeCheckResult.toString())
  } catch (error) {
    throw new Error("Type-checking failed")
  }
})
