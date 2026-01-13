const {start} = require("./src/start-stop.js");

async function test() {
  console.log("Testing start function...");
  try {
    const result = await start();
    console.log("Start result:", result);
    if (!result) {
      console.error("Start returned false");
      process.exit(1);
    }
    console.log("Start completed successfully");
  } catch (error) {
    console.error("Start threw error:", error);
    process.exit(1);
  }
}

test();
