const API_URL = "/api/internships";

const search = document.getElementById("search");
const container = document.getElementById("internshipList");

let allInternships = [];

async function loadInternships() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to load internships");
        }

        allInternships = await response.json();

        displayInternships(allInternships);

    } catch (error) {
        console.error("API Error:", error);

        if (container) {
            container.innerHTML = `
                <p>Unable to load internships. Please try again.</p>
            `;
        }
    }
}

function displayInternships(internships) {

    if (!container) {
        console.error("Internship container not found.");
        return;
    }

    container.innerHTML = "";

    if (internships.length === 0) {
        container.innerHTML = `
            <p>No internships found.</p>
        `;
        return;
    }

    internships.forEach(function (internship) {

        const card = document.createElement("div");

        card.className = "internship";

        card.innerHTML = `
            <h3>${internship.title}</h3>
            <p>Company: ${internship.company}</p>
            <p>Location: ${internship.location || "Not specified"}</p>
            <p>Duration: ${internship.duration || "Not specified"}</p>
            <p>${internship.description || ""}</p>
            <button onclick="selectInternship(${internship.id})">
                Apply Now
            </button>
        `;

        container.appendChild(card);
    });
}

if (search) {

    search.addEventListener("input", function () {

        const searchText = search.value.toLowerCase().trim();

        const filtered = allInternships.filter(function (internship) {

            const text = `
                ${internship.title}
                ${internship.company}
                ${internship.location}
                ${internship.duration}
                ${internship.description}
            `.toLowerCase();

            return text.includes(searchText);
        });

        displayInternships(filtered);
    });
}

function selectInternship(id) {
    const internshipId = document.getElementById("internshipId");

    if (internshipId) {
        internshipId.value = id;

        document.getElementById("applicationSection")
            .scrollIntoView({ behavior: "smooth" });
    }
}

loadInternships();

// Submit internship application
const applicationForm = document.getElementById("applicationForm");
const applicationMessage = document.getElementById("applicationMessage");

if (applicationForm) {
    applicationForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("applicantName").value.trim();
        const email = document.getElementById("applicantEmail").value.trim();
        const phone = document.getElementById("applicantPhone").value.trim();
        const internshipId = document.getElementById("internshipId").value;

        try {
            const response = await fetch("/api/applications", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    internshipId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to submit application");
            }

            applicationMessage.textContent = data.message;
            applicationMessage.style.color = "green";

            applicationForm.reset();

        } catch (error) {
            console.error("Application error:", error);

            applicationMessage.textContent = error.message;
            applicationMessage.style.color = "red";
        }
    });
}