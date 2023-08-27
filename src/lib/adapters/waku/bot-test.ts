// run with npx ts-node --esm --experimental-specifier-resolution=node ./src/lib/adapters/waku/cli.ts

async function main() {
	const text = `
    {"cmd": "append", "text": " Hi"}
    {"cmd": "append", "text": "!"}
    {"cmd": "append", "text": " What"}
    {"cmd": "append", "text": " can"}
    {"cmd": "append", "text": " I"}
    {"cmd": "append", "text": " do"}
    {"cmd": "append", "text": " for"}
    {"cmd": "append", "text": " you"}
    {"cmd": "append", "text": "?"}    

    `
	const output = text
		.split('\n')
		.map((s) => s.trim())
		.filter((s) => s)
		.map((part: string) => {
			console.debug({ part })
			return JSON.parse(part) as { cmd: string; text: string }
		})
		.filter((obj) => typeof obj === 'object' && obj.cmd === 'append')
		.map((obj) => obj.text)
		.join('')

	console.debug({ output })
}

main().catch(console.error)
