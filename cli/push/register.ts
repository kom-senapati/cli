import type { Command } from "commander"
import { getKy } from "../../lib/registry-api/get-ky"
import { cliConfig } from "../../lib/cli-config"
import { join } from "node:path"
import { readFile } from "node:fs/promises"
import { existsSync } from "node:fs"

export const registerPush = (program: Command) => {
  program
    .command("push")
    .description("Push snippet code to Registry API")
    .argument("[file]", "Path to circuit file (default: index.tsx)")
    .option("-n, --name <name>", "Name of the circuit")
    .action(async (file, options) => {
      const token = cliConfig.get("sessionToken")
      if (!token) {
        throw new Error("Not logged in. Please run 'tsci login' first.")
      }
      // const username = cliConfig.get("githubUsername");

      const circuitPath = file || "index.tsx"
      const fullCircuitPath = join(process.cwd(), circuitPath)

      if (!existsSync(fullCircuitPath)) {
        throw new Error(`Could not find circuit file at ${circuitPath}`)
      }

      const circuitCode = await readFile(fullCircuitPath, "utf-8")
      const circuitDir = join(process.cwd(), circuitPath, "..")
      const manualEditsPath = join(circuitDir, "manual-edits.json")
      const manualEdits = existsSync(manualEditsPath)
        ? await readFile(manualEditsPath, "utf-8")
        : "{}"

      const ky = getKy()

      if (options.name) {
        const searchResponse = await ky
          .get(`snippets/search?q=${encodeURIComponent(options.name)}`)
          .json()
          .catch(() => ({ snippets: [] }))

        const snippets = (searchResponse as any).snippets || []
        // const existingSnippet = snippets.find(
        //   (s: any) => s.name === `${username}/${options.name}`
        // );

        // if (existingSnippet) {
        //   console.error(
        //     `Error: Snippet with name "${options.name}" already exists`
        //   );
        //   console.error(`Try using a different name with the -n option`);
        //   process.exit(1);
        // }
      }

      const response = await ky
        .post("snippets/create", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          json: {
            unscoped_name: options.name || "",
            code: circuitCode,
            manual_edits_json_content: manualEdits,
            snippet_type: circuitCode.includes("<board") ? "board" : "package",
          },
        })
        .json()

      const snippet = (response as any).snippet
      console.log(`Successfully pushed ${snippet.unscoped_name} to registry`)
    })
}
