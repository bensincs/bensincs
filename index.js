import Handlebars from "handlebars";
import fs from "fs";
import axios from "axios";

// GitHub API settings
const GITHUB_API_URL = 'https://api.github.com/user/repos?affiliation=owner,collaborator';
const TOKEN = process.env.GITHUB_TOKEN;
// File paths
const templatePath = "README.hbs";
const outputPath = "README.md";

const api = axios.create({
    baseURL: GITHUB_API_URL,
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
      const response = await api.get('', { params: { per_page: 100, page } });
      const data = response.data;

      if (data.length === 0) break; // Exit when no more repositories are available

      repos = repos.concat(data);
      page++;
    }

    return repos;
};

// Function to capitalize the first letter of a string
const capitalize = (name) => {
    return name.charAt(0).toUpperCase() + name.slice(1);
};

// Fetch the repositories
const repos = await fetchRepositories();

// Sort the repositories by owner where microsoft and bensincs are at the top
repos.sort((a, b) => {
    const ownerA = a.owner.login;
    const ownerB = b.owner.login;

    if (ownerA === "microsoft" || ownerA === "bensincs") {
        return -1;
    }

    if (ownerB === "microsoft" || ownerB === "bensincs") {
        return 1;
    }

    return ownerA.localeCompare(ownerB);
});


// Split the repos by owner
const reposByOwner = repos.reduce((acc, repo) => {
    if (!acc[repo.owner.login]) {
        acc[repo.owner.login] = [];
    }

    acc[repo.owner.login].push(repo);
    return acc;
}, {});

// Add some additional information to each owner
Object.keys(reposByOwner).forEach((owner) => {
    const repos = reposByOwner[owner];
    const ownerName = capitalize(owner);
    const ownerNamePossessive = ownerName[ownerName.length - 1] === "s" ? `${ownerName}'` : `${ownerName}'s`;
    const repoPlural = repos.length > 1 ? "Repositories" : "Repository";

    reposByOwner[owner] = {
        ownerNamePossessive,
        repos,
        repoPlural
    };
});

console.log(reposByOwner);

// Read the template file
fs.readFile(templatePath, "utf-8", (err, data) => {
    if (err) {
        console.error("Error reading the template file:", err);
        return;
    }

    const template = Handlebars.compile(data);
    // Generate the README.md file
    const result = template({
        reposByOwner
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

