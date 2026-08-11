# aredl-thing
Discord bot that fetches AREDL data and display them.

## Build Instructions (just boilerplate because i'm too lazy to copy over)
### Prerequisites
1. [Git](https://git-scm.com/). (why are you even on github without git)
2. [Node.js](https://nodejs.org/en/download). (and also npm but that should come with node, i think)
3. A [Discord](https://discord.com/developers/applications/) bot token.

### Build
1. Install dependencies:
```bash
npm install
```
2. Build:
```bash
npm run build
```

### After Building
1. Create a file named ".env" and put it in public/ (or whatever folder the main.js file is in, but it should be public/ by default). The file should look something like this:
```txt
# required:
DISCORD_TOKEN= # bot token. do not fucking share this shit with anyone that has no business having it
CLIENT_ID= # bot id

# optional:
ADMINISTRATOR_IDS= # an array of ids of bot admins as strings. this is an empty array by default
EMBED_EXPIRY_DURATION= # lifetime of embeds, this is 15 minutes (900 seconds) by default
```
2. Register your bot's command: (Note: rerun this every time you modified the commands' property (name, description, options), or just make it run every time the bot starts)
```bash
npm run deploy
```
3. To start the build:
```bash
npm run start
```
4. Alternatively, run without building:
```bash
npm run dev
```

## License
This project is licensed under the [GNU General Public License 3.0](LICENSE).