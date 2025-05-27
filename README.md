# Maoli World Forum

A modern forum platform for the Hawaiian community, built with Next.js, Prisma, and PostgreSQL. Features include user authentication, forum discussions, comments, and Fediverse integration.

## Features

- 🏄‍♂️ Modern, responsive design
- 🔐 User authentication with NextAuth.js
- 💬 Rich text forum discussions
- 🏷️ Categories and tags
- 💌 Comment system with nested replies
- 🌐 Fediverse integration (ActivityPub)
- 🔍 Advanced search functionality
- 📱 Mobile-friendly interface

## Prerequisites

- Node.js 20 or later
- PostgreSQL 15 or later
- Docker and Docker Compose (for containerized deployment)
- Git

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/maoliworld.git
cd maoliworld
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit `.env` with your configuration values.

4. Start the development server:
```bash
npm run dev
```

## Docker Deployment

1. Build and start the containers:
```bash
docker-compose up --build
```

2. Run database migrations:
```bash
docker-compose exec app npx prisma migrate deploy
```

3. The application will be available at `http://localhost:3000`

## Production Deployment

### Option 1: Traditional VPS (e.g., DigitalOcean, AWS EC2)

1. Set up a VPS with Ubuntu 22.04 LTS

2. Install Docker and Docker Compose:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt-get install docker-compose
```

3. Clone the repository:
```bash
git clone https://github.com/yourusername/maoliworld.git
cd maoliworld
```

4. Configure environment variables:
```bash
cp .env.example .env
nano .env
```

5. Start the application:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Option 2: Platform as a Service (e.g., Vercel, Railway)

1. Fork the repository to your GitHub account

2. Connect your repository to your preferred platform:
   - [Vercel](https://vercel.com)
   - [Railway](https://railway.app)
   - [Render](https://render.com)

3. Configure environment variables in the platform's dashboard

4. Deploy the application

## Database Management

### Backup
```bash
docker-compose exec db pg_dump -U postgres maoliworld > backup.sql
```

### Restore
```bash
docker-compose exec -T db psql -U postgres maoliworld < backup.sql
```

## Migrating from Ning

1. Run the migration script:
```bash
npm run migrate
```

This will:
- Scrape content from the old Ning site
- Import users, posts, and comments
- Preserve timestamps and relationships

## Environment Variables

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@db:5432/maoliworld"

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret-key"

# Site Configuration
NEXT_PUBLIC_SITE_URL="https://your-domain.com"

# ActivityPub
ACTIVITYPUB_PUBLIC_KEY="your-public-key"
ACTIVITYPUB_PRIVATE_KEY="your-private-key"

# Forum Configuration
DEFAULT_FORUM_ID="your-forum-id"
```

## Security Considerations

1. Use strong passwords for all services
2. Keep your environment variables secure
3. Regularly update dependencies
4. Enable HTTPS
5. Set up proper backup strategies
6. Monitor application logs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.

## Acknowledgments

- Next.js team for the amazing framework
- Prisma team for the database toolkit
- The Hawaiian community for inspiration 