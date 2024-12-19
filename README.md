*User Management:*
•⁠  ⁠User registration and login with JWT authentication.
•⁠  ⁠User roles: Admin and Regular User.
•⁠  ⁠Only Admins can create other Admins.

*Task Management:*
•⁠  ⁠Users can create tasks with a title, description, due date, and status (e.g., To-Do, In Progress, Completed).
•⁠  ⁠Users can assign tasks to themselves or others.
•⁠  ⁠Users can update the status of their own tasks.
•⁠  ⁠Admins can update the status of any task.

*Tagging System:*
•⁠  ⁠Users can add tags to tasks (e.g., "Urgent", "Bug", "Feature").
•⁠  ⁠Users can filter tasks by tag.

*Commenting System:*
•⁠  ⁠Users can add comments to tasks.
•⁠  ⁠Users can edit or delete their own comments.
•⁠  ⁠Admins can delete any comment.

*Validation:*
•⁠  ⁠Implement payload validation for all endpoints (e.g., valid email format, required fields, etc.).

*Database:*
•⁠  ⁠MySQL was used with migrations for setting up the database schema.