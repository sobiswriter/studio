# Pixel Due

Pixel Due is a gamified to-do list application designed to make managing your daily tasks more fun and engaging. Turn your chores and goals into quests, earn experience points (XP), level up, and interact with your quirky AI companion, Pixel Pal!

Whether it's conquering your work projects, learning new skills, or just remembering to water the plants, Pixel Due aims to add a touch of adventure to your productivity.

## Features

*   **Gamified Task Management:** Transform your to-do list into a series of quests.
*   **Earn XP and Level Up:** Gain experience points for completing tasks and track your progress.
*   **Pixel Pal Companion:** Interact with an AI companion to get assistance and commentary.
*   **Daily Bounties:** Take on challenging daily tasks for extra rewards.
*   **User Profiles:** Track your stats and progress.
*   **Customization:** Personalize your experience.

## Tech Stack

Pixel Due is proudly built with a modern tech stack:

*   **Frontend:**
    *   Next.js (App Router) & React
    *   TypeScript
    *   Tailwind CSS & ShadCN UI
*   **Backend/Database:**
    *   Firebase (Firestore for database, Authentication)
*   **AI:**
    *   Genkit & Google AI (for Pixel Pal's intelligence)

## Getting Started

Follow these steps to set up and run the project locally:

1.  **Clone the repository:**
    ```bash
    git clone <your_repo_url>
    ```
2.  **Install dependencies:**
    Navigate to the project directory and install the necessary dependencies:
    ```bash
    cd pixel-due
    npm install
    ```
3.  **Set up Firebase:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
    *   Set up Firebase Authentication (e.g., Email/Password provider).
    *   Set up Firestore Database. Choose a starting mode (e.g., test mode for development, then set up proper security rules).
    *   Register a web app with your Firebase project.
    *   Copy your Firebase configuration object.
    *   Create a `.env.local` file in the root of your project and add your Firebase configuration and other environment variables. Your `.env.local` file should look something like this:

        ```env
        NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
        NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
        NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
        NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID
        ```
    *   Make sure these variables are accessed correctly in your Firebase initialization code (e.g., `src/lib/firebase.ts`).

4.  **Set up Google AI/Genkit:**
    *   Ensure you have a Google Cloud project set up.
    *   Enable the Generative Language API (or the Vertex AI API if using Vertex AI).
    *   Authenticate your environment for Google Cloud. The easiest way for local development is often using the Google Cloud CLI:
        ```bash
        gcloud auth application-default login
        ```
    *   Ensure your Genkit configuration (`src/ai/genkit.ts`) correctly references the models you intend to use (e.g., `gemini-pro`).

5.  **Run the Development Servers:**
    *   Start the Genkit development UI (optional, but helpful for testing flows):
        ```bash
        genkit start
        ```
    *   In a separate terminal, run the Next.js development server:
        ```bash
        npm run dev
        ```
    *   The application should now be running at `http://localhost:3000` (or the port specified by Next.js).

## Contributing

**(Add instructions on how others can contribute)**

## License

**(Add license information)**

## Contact

**(Add contact information)**
