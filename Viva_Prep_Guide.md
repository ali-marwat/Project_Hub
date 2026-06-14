# Project Hub - Viva Preparation Guide

This guide is designed to help you prepare for the final year project (FYP) viva for **Project Hub**. It covers the most likely questions you'll be asked regarding your system architecture, technology stack, and specific features you implemented.

## 1. Project Overview & Motivation

**Q: What is the main objective of Project Hub?**
* **Answer:** Project Hub is a centralized platform designed to showcase, discover, and manage student/developer projects. It solves the problem of scattered project repositories by providing a single place where users can submit projects, and others can filter, search, and view them easily.

**Q: What problem does your project solve?**
* **Answer:** It makes it easier for students, recruiters, and peers to find interesting projects. Instead of hunting for links, users have an organized dashboard with categorized projects, dynamic GitHub statistics, and clear overviews.

## 2. Technology Stack & Architecture

**Q: Why did you choose your specific tech stack (HTML, CSS, JavaScript, Firebase)?**
* **Answer:** 
  * **Frontend (HTML/CSS/JS):** Chosen for lightweight, fast rendering and direct control over the UI/UX. Vanilla CSS/JS avoids the overhead of large frameworks while still allowing for a highly dynamic and responsive design.
  * **Backend/Database (Firebase):** Firebase Firestore provides a fast, NoSQL cloud database that syncs in real-time. Firebase Auth handles secure user logins without needing to build a custom authentication system from scratch.

**Q: How does the application connect to GitHub?**
* **Answer:** The application integrates with the public GitHub API. When a user views a project, we fetch real-time data such as the repository's language statistics (creating the visual language bar) to give an accurate, up-to-date overview of the tech used in that repository.

## 3. Key Features & Implementation

**Q: How does the Admin Panel work?**
* **Answer:** The admin panel is a secured area where authorized users can review submitted projects. I implemented specific logic so that only "Pending" projects show the "Reject" or "Approve" buttons, preventing accidental state changes on already processed projects.

**Q: Explain your database schema.**
* **Answer:** We use Firebase Firestore (NoSQL). The main collection is `projects`, where each document represents a project containing fields like `title`, `description`, `githubLink`, `category`, `status` (pending/approved), and `author`. 

**Q: How did you implement filtering and sorting?**
* **Answer:** I built a dynamic UI with horizontally scrolling tabs. When a user clicks a category (e.g., "Web", "Mobile"), JavaScript filters the active project list from Firestore and auto-scrolls the view to ensure a smooth, seamless user experience.

## 4. Challenges & Troubleshooting

**Q: What was the most difficult challenge you faced, and how did you solve it?**
* **Answer:** (Customize this based on your experience) One major challenge was handling the GitHub API rate limits and "Bad Credentials" errors. I solved this by ensuring API requests were properly authenticated and caching data where appropriate to avoid hitting rate limits. Another challenge was Firebase connection errors (`net::ERR_NAME_NOT_RESOLVED`), which I fixed by correctly configuring the Firebase SDK CDN links and ensuring proper initialization order in `firebase-config.js`.

## 5. Security & Validation

**Q: How do you ensure the data submitted is valid?**
* **Answer:** I implemented strict frontend validation on all input forms. For example, ensuring GitHub URLs match a specific regex pattern before submission, and sanitizing inputs to prevent bad or incomplete data from reaching the Firestore database.

**Q: How is the application secured?**
* **Answer:** We use Firebase Authentication to secure user sessions. Firestore Security Rules are implemented (`firestore.rules`) to ensure only authenticated users can submit projects, and only admins can modify project statuses (Approve/Reject).

## 6. Future Enhancements

**Q: If you had more time, what would you add to this project?**
* **Answer:** 
  * Implement user profiles and portfolios.
  * Add an upvote/rating system for projects.
  * Integrate CI/CD to automatically pull project readmes or deployment links.

---
**Preparation Tips:**
* **Run your project locally** before the presentation and make sure the database connection is active.
* **Be ready to show code:** They might ask you to open specific files (like `firebase-config.js` or `main.js`) to explain your filtering logic or API calls.
* **Keep answers concise:** Answer directly, and offer to go into more detail if they ask.
