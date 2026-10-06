const API_URL = "http://localhost:5000/api/internships";

const search = document.getElementById("search");

// Load internships from REST API
async function loadInternships() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to load internships");
        }

        const internships = await response.json();

        displayInternships(internships);

    } catch (error) {
        console.error("API Error:", error);
    }
}


// Display internships on the website
function displayInternships(internships) {

    const existingInternship = document.querySelector(".internship");

    if (!existingInternship) {
        console.error("Internship container not found.");
        return;
    }

    const container = existingInternship.parentElement;

    container.innerHTML = "";

    internships.forEach(function (internship) {

        const card = document.createElement("div");

        card.className = "internship";

        card.innerHTML = `
            <h3>${internship.title}</h3>

            <p>Company: ${internship.company}</p>

            <p>Location: ${internship.location || "Not specified"}</p>

            <p>Duration: ${internship.duration || "Not specified"}</p>

            <p>${internship.description || ""}</p>

            <button>Apply Now</button>
        `;

        container.appendChild(card);
    });
}


// Search internships
if (search) {

    search.addEventListener("input", function () {

        const searchText = search.value.toLowerCase();

        const internships =
            document.querySelectorAll(".internship");

        internships.forEach(function (internship) {

            const text =
                internship.textContent.toLowerCase();

            if (text.includes(searchText)) {

                internship.style.display = "block";

            } else {

                internship.style.display = "none";
            }
        });
    });
}


// Load data when page opens
loadInternships();