import Handlebars from "handlebars";
import fs from "fs";
import axios from "axios";

// GitHub API settings
const GITHUB_REPOS_API_URL = 'https://api.github.com/user/repos?affiliation=owner,collaborator';
const TOKEN = process.env.GITHUB_TOKEN;
// File paths
const templatePath = "README.hbs";
const outputPath = "README.md";

const api = axios.create({
    baseURL: '',
    headers: {
      Authorization: `token ${TOKEN}`,
      'User-Agent': 'Node.js Script'
    }
});

// Function to fetch repositories
const fetchRepositories = async () => {
    let repos = [];
    let page = 1;

    while (true) {
      const response = await api.get(GITHUB_REPOS_API_URL, { params: { per_page: 100, page } });
      const data = response.data;

      if (data.length === 0) break; // Exit when no more repositories are available

      repos = repos.concat(data);
      page++;
    }

    return repos;
};

// Fetch the repositories
const repos = await fetchRepositories();

const microsoftRepos = repos.filter(repo => repo.owner.login === "microsoft");

// read the tech json file
const tech = JSON.parse(fs.readFileSync("tech.json", "utf-8"));

const findContrast = (hex) => {
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness > 155 ? "000000" : "ffffff";
};

// for each of the sections in the tech file
for (const section of Object.keys(tech)) {
    const sectionData = tech[section];

    sectionData.items.forEach(sectionDatum => {
        const blackOrWhite = findContrast(sectionDatum.color);
        const encodedName = encodeURIComponent(sectionDatum.name);
        sectionDatum.badge = `https://img.shields.io/badge/${encodedName}-${sectionDatum.color}?logo=${sectionDatum.simpleIcon}&logoColor=${blackOrWhite}&style=for-the-badge`;
    });
}


// Read the template file
fs.readFile(templatePath, "utf-8", (err, data) => {
    if (err) {
        console.error("Error reading the template file:", err);
        return;
    }

    const template = Handlebars.compile(data);
    // Generate the README.md file
    const result = template({
        microsoftRepos,
        tech
    });

    // Write the output file
    fs.writeFile(outputPath, result, (err) => {
        if (err) {
            console.error("Error writing the output file:", err);
            return;
        }

        console.log("README.md has been generated successfully.");
    });
});

