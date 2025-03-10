# PHP REST API

This project provides a REST API for accessing a MySQL database. It allows for user-related operations such as creating, retrieving, updating, and deleting users.

## Project Structure

```
php-rest-api
├── src
│   ├── config
│   │   └── database.php       # Database configuration
│   ├── controllers
│   │   └── UserController.php  # Handles user-related API requests
│   ├── models
│   │   └── User.php            # Represents the user entity
│   ├── routes
│   │   └── api.php             # API routes for user operations
│   └── index.php               # Entry point of the application
├── composer.json                # Composer dependencies
└── README.md                    # Project documentation
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd php-rest-api
   ```

3. Install dependencies using Composer:
   ```
   composer install
   ```

4. Configure the database connection in `src/config/database.php` with your MySQL credentials.

## Usage

1. Start the PHP built-in server:
   ```
   php -S localhost:8000 -t src
   ```

2. Access the API endpoints:
   - **GET /api/users** - Retrieve all users
   - **GET /api/users/{id}** - Retrieve a user by ID
   - **POST /api/users** - Create a new user
   - **PUT /api/users/{id}** - Update an existing user
   - **DELETE /api/users/{id}** - Delete a user

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License.