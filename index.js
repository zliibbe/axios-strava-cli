import "dotenv/config";
import axios from "axios";
import inquirer from "inquirer";
import chalk from "chalk";

// Create axios instance
const stravaApi = axios.create({
  baseURL: "https://www.strava.com/api/v3",
});

// Axios interceptor example
stravaApi.interceptors.request.use(
  async (config) => {
    // Get access token before each request
    const tokenResponse = await getAccessToken();
    config.headers.Authorization = `Bearer ${tokenResponse.access_token}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

async function getAccessToken() {
  try {
    const response = await axios.post("https://www.strava.com/oauth/token", {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: process.env.STRAVA_REFRESH_TOKEN,
      grant_type: "refresh_token",
    });
    return response.data;
  } catch (error) {
    console.error("Error getting access token:", error.message);
    process.exit(1);
  }
}

async function getLatestActivity(activityType) {
  try {
    const response = await stravaApi.get("/athlete/activities", {
      params: {
        per_page: 10, // Get last 10 activities to search through
      },
    });

    const filteredActivity = response.data.find(
      (activity) => activity.type === activityType
    );

    if (!filteredActivity) {
      console.log(
        chalk.red(`No ${activityType} found in your recent activities.`)
      );
      return;
    }

    // Format the output
    console.log("\n" + chalk.green("🏃‍♂️ Activity Details:"));
    console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━"));
    console.log(chalk.yellow("Type:"), filteredActivity.type);
    console.log(chalk.yellow("Name:"), filteredActivity.name);
    console.log(
      chalk.yellow("Date:"),
      new Date(filteredActivity.start_date).toLocaleDateString()
    );
    console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━\n"));
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error(chalk.red("Response Error:"), error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error(chalk.red("Request Error:"), error.request);
    } else {
      // Something happened in setting up the request
      console.error(chalk.red("Error:"), error.message);
    }
  }
}

async function main() {
  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "activityType",
      message: "What activity would you like to find most-recent data about?",
      choices: ["Walk", "Run", "Ride", "WeightTraining"],
    },
  ]);

  await getLatestActivity(answers.activityType);
}

main();
