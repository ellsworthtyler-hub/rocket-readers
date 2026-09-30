import fs from "fs";
import path from "path";

// Tailwind's class scanner must stay in this app. Next sometimes omits the
// CSS file path, and Tailwind then looks in the parent literacyproject folder.
const setCssFrom = {
  postcssPlugin: "rocket-readers-css-from",
  Once(_css, { result }) {
    const from = result.opts.from;
    if (!from || !fs.existsSync(from)) {
      result.opts.from = path.join(process.cwd(), "app", "globals.css");
    }
  },
};

export default {
  plugins: [setCssFrom, "@tailwindcss/postcss"],
};
