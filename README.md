# ft_transcendence: Crazzy Pong 🎾

# 🚀 Project Overview
ft_transcendence is a dynamic web platform where users engage in the classic Pong game with a modern twist. It facilitates real-time multiplayer gaming and chat interactions among players.

# 💻 Tech Stack
- Frontend: ReactJS
- Backend: NestJS
- Database: PostgreSQL
- ORM: Prisma for database management

# 📦 Deployment
The application uses Docker and consists of three main services:

- ReactJS: Manages the frontend.
- NestJS: Handles backend operations.
- PostgreSQL: Database service.
  
Launch the application with a single command: docker-compose up --build.

# 🛠️ Requirements
- Single Page Application: Navigable via browser's back and forward buttons.
- Browser Compatibility: Supports the latest stable versions of Google Chrome and one other browser.
- Error Handling:
  - Error Boundaries: React's error boundaries are implemented for gracefully handling UI errors.
  - Async Error Catching: Catching and managing errors from asynchronous functions to maintain stability.
  - Robust Error Feedback: Users receive clear, informative feedback on encountered errors.

# 🔒 Key Features and Security
- User Authentication: Via 42's API, with session management using cookies for secure and persistent login experiences.
- Real-Time Interactions: Utilization of WebSockets for both the Pong game and chat system, enabling live and responsive user interactions.
- Chat System: Offers real-time messaging, including private/public channels, administrative functionalities, and user blocking.
- Pong Game: Includes both classic and power-up modes with a matchmaking system for player pairing.
- User Profiles: Showcases individual game history and player stats.
- Password Security: Passwords are securely hashed using the Argon algorithm.
- SQL Injection Protection: ORM (Prisma) provides robust protection against SQL injection vulnerabilities.
- Environment Variables: Sensitive information is securely stored in .env files and excluded from version control.

# 🌟 Getting Started
Clone the repository and follow the setup instructions in the docker-compose file. 
Docker installation is required.

# 📈 User Account Features
- OAuth login through 42 intranet.
- Unique username and avatar customization.
- Optional two-factor authentication with a QR Code. 
- Friendship system with real-time status updates.
- Detailed Match History for every user.

# 💬 Chat Functionalities
- Create and manage various channel types.
- Direct messaging with block functionality.
- Administrative tools for channel moderation.
- In-chat game invitations and profile access.

# 🎮 Game Dynamics
- Responsive, live Pong game.
- Automatic matchmaking for players.
- Customizable gameplay options.
- Reliable handling of network interruptions for seamless play.

# 👥 Contribution and Development
This project is a collaborative effort :

<p align="center">
<a href="http://github.com/adcarnec" alt="adcanec github profile"><img src="https://github.com/adcarnec.png" width="60px style="border-radius:50%"/></a>
<a href="http://github.com/JuanBraco" alt="JuanBraco github profile"><img src="https://github.com/JuanBraco.png" width="60px style="border-radius:50%"/></a>
<a href="http://github.com/tiny-chris" alt="tiny-chris github profile"><img src="https://github.com/tiny-chris.png" width="60px style="border-radius:50%"/></a>
</p>

Each contributor has played a major role in bringing various aspects of the application to life. Feel free to explore their profiles and contributions to this project!

