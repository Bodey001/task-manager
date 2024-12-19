require('dotenv').config();
const express = require('express');
const PORT = process.env.PORT;
const sequelize = require('./config/sequelize');
const User = require('./model/user');
const Task = require('./model/task');
const Comment = require('./model/comment');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');




const app = express();
app.use(express.json());



//          ASSOCIATIONS
//linking user to task via fk
User.hasMany(Task, { foreignKey: 'userId', onDelete: 'CASCADE', onUpdate: 'CASCADE'});
Task.belongsTo(User, {foreignKey: 'userId'});

//linking user to comments via fk
User.hasMany(Comment, { foreignKey: 'userId', onDelete: 'CASCADE', onUpdate: 'CASCADE'});
Comment.belongsTo(User, { foreignKey: 'userId'});

//linking tasks to comments by fk
Task.hasMany(Comment, { foreignKey: 'taskId', onDelete: 'CASCADE', onUpdate: 'CASCADE'});
Comment.belongsTo(Task, { foreignKey: 'taskId'});



//          HOMEPAGE
app.get('/', (req, res) => {
    res.status(200).json({message: 'Welcome to homepage'});
});



//          REGISTRATION

app.post('/register', async (req, res) => {
    const { name , email, password} = req.body;

    try {
        if(!name || !email || !password) {
            return res.status(400).json( { message: "All empty field must be filled"});
        }

        const user = await User.findOne({ where: {email}});
        if (user) {
            return res.status(400).json({ message: `User already exists`})
        }


        if(password.length < 8) {
            return res.status(400).json({ message: `Password must be atleast 8 characters long`});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        console.log(hashedPassword);

        const newUser = {
            name,
            email,
            password: hashedPassword,
            role: 'user'
        };

        await User.create(newUser);
        return res.status(201).json({ message: 'User created successfully'});
    } catch (error) {
        res.status(500).json({ message: `Internal Server Error ${error.message}`});
        console.log(error);
    };
});


//          LOGIN

app.post('/login', async (req, res) => {
    const { email, password} = req.body;

    try {
        const user = await User.findOne({ where: { email}});

        if(!user) {
            return res.status(400).json({ message: `Incorrect email or password`});
        };

        // if(user.role === 'admin') {
        //     return res.status(403).json({ message: `Access denied`})
        // };

        const checkPassword = await bcrypt.compare(password, user.password);

        if(!checkPassword) {
            return res.status(400).json({ message: 'Incorrect email or password'});
        }

        const accessToken = jwt.sign(
            {id: user.id, name: user.name , email: user.email}, 
            process.env.JWT_KEY
        );

        return res.status(200).json({ message: "Login successful"});
        //redirect to admin 

    } catch (error) {
        res.status(500).json({ message: `Internal Server Error ${error.message}`})
        console.log(error);
    };
});
     

//admin login
app.post('/admin/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ where: { email}});

        if(!user) {
            return res.status(400).json({ message: `Incorrect email or password`});
        }

        if(user.role !== 'admin') {
            return res.status(403).json({ message: `Access denied`});
        }

        const checkPassword = bcrypt.compare(password, user.password);

        if(!checkPassword) {
            return res.status(400).json({ message: `Incorrect email or password`});
        };

        const accessToken = jwt.sign(
            {id: user.id, name: user.name, email: user.email },
            process.env.JWT_KEY
        );

        return res.status(200).json({ message: 'Login successfully'});
    }catch (error) {
        res.status(500).json({ message: `Internal server error ${error.message}` });
        console.log(error);
    };
});


//admins can create other admins
app.post('/users/create-admin/:adminId', async (req, res) => {
    const { adminId } = req.params;
    const { name, email, password } = req.body;

    try{
        const user = await User.findOne({ where: { id: adminId}});
        if(!user) {
            return res.status(400).json({ message: `User not found`});
        };

        if(user.role !== 'admin') {
            return res.status(403).json({ message: `Unauthorised access`});
        };

        const recipient = await User.findOne({ where: {email}});
        if (recipient) {
            return res.status(400).json({ message: `Recipient already exists`})
        }

        if(password.length < 8) {
            return res.status(400).json({ message: `Password must be atleast 8 characters long`});
        }
        

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            name,
            email,
            password: hashedPassword,
            role: 'admin'
        }

        await User.create(newUser);
        return res.status(201).json({ message: `Admin ${email} has been successfully created`});

    } catch (error) {
        res.status(500).json({ message: `Internal server error ${error.message}` });
        console.log(error);
    };
});


//                          GET USERS
//all users
app.get('/users', async(req, res) => {
    try{
        const users = await User.findAll();
        if(!users) {
            return res.status(404).json({ message: `No user found`});
        };
        return res.status(200).json({ message: `All users retrieved successfully`, users});

    } catch (error) {
        res.status(500).json({ message: `Internal server error ${error.message}` });
        console.log(error);
    };
})

//users by id
app.get('/users/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findOne({ where: {id: userId}});
        if (!user) {
            return res.status(404).json({ message: `User not found`});
        };

        return res.status(200).json({ message: `User has been successfully retrieved`, user});
    } catch (error) {
        res.status(500).json({ message: `Internal server error: ${error.message}` });
        console.log(error);
    };
});



//                          GET TASKS
//all tasks
app.get('/tasks', async (req, res) => {
    try{
        const tasks = await Task.findAll();
        if(!tasks) {
            return res.status(404).json({ message: `No task found`});
        };

        return res.status(200).json({ message: `All tasks retrieved successfully`, tasks});

    } catch (error) {
        res.status(500).json({ message: `Internal server error: ${error.message}` });
        console.log(error);
    };
});

//tasks by id
app.get('/tasks/:taskId', async (req, res) => {
    const { taskId } = req.params;

    try {
        const task = await Task.findOne({ where: {id: taskId}});
        if (!task) {
            return res.status(404).json({ message: `Task not found`});
        };

        return res.status(200).json({ message: `Task has been successfully retrieved`, task});
    } catch (error) {
        res.status(500).json({ message: `Internal server error: ${error.message}` });
        console.log(error);
    };
});


//                          GET COMMENT
//all comment
app.get('/comments', async (req, res) => {

    try{
        const comments = await Comment.findAll();

        return res.status(200).json({ message: `Comments retrieved successfully`, comments});
        
    }catch (error) {
        res.status(500).json({ message: `Internal server error: ${error.message}` });
        console.log(error);
    };
});








//                      TASK MANAGEMENT 
//creating tasks
app.post('/create-task/:userId', async (req, res) => {
    const { userId } = req.params;
    const { title, description, dueDate, status, recipientEmail } = req.body;

    try {
        if(!title || !dueDate || !recipientEmail) {
            return res.status(400).json( { message: "Title, dueDate and recipientEmail fields must be filled"});
        }

        const user = await User.findOne({ where: { id: userId}});
        if(!user) {
            return res.status(400).json({ message: `User does not exist`});
        };

        const recipient = await User.findOne({where: { email: recipientEmail }});
        if(!recipient){
            return res.status(400).json({ message: `Task recipient does not exist`});
        };

        if(user.role === 'user' && recipient.role === 'admin') {
            return res.status(400).json({ message: `Sorry you cannot assign task to an admin`});
        };

        const newTask = {
            title,
            description,
            dueDate,
            status,
            userId: recipient.id,
            assignedBy: user.id
        };

        const task = await Task.create(newTask);
        return res.status(200).json({ message: `Task has been successfully created`, task});
        
    } catch (error) {
        res.status(500).json({ message: `Internal server error ${error.message}` });
        console.log(error);
    };
});


//updating tasks status
app.patch('/tasks/update-status/:userId/:taskId', async (req, res) => {
    const { userId, taskId } = req.params;
    const { status } = req.body;
    
    try{
        
        const user = await User.findOne({ where: { id: userId}});           //find user
        if(!user) {                                                         //checks if users exists
            return res.status(404).json({ message: `User does not exist`});
        }

        const task = await Task.findOne({ where: { id: taskId}});
            
            if(!task) {
                return res.status(404).json({ message: `Task not found`});
            };

        //if user is an admin, update any task
        if(user.role === 'admin') {    
            
            await Task.update({status}, { where: { id: taskId}});
            return res.status(200).json({ message: `Task status has been updated successfully`});
        };
        
        const checkTask = task.userId === user.id;

        if(!checkTask) {
            return res.status(403).json({message: `Unauthorised`});
        }

        await Task.update({status}, { where: { id: taskId}});
        return res.status(200).json({ message: `Task status has been updated successfully`});

    } catch (error) {
        res.status(500).json({ message: `Internal server error ${error.message}` });
        console.log(error);
    };
});


//                          TAGGING SYSTEM
//adding tags
app.patch('/tasks/update-tags/:taskId', async (req, res) => {
    const { taskId } = req.params;
    const { tags } = req.body;

    try {
        await Task.update({tags}, { where: { id: taskId}});
        return res.status(200).json({ message: `Tag added successfully`});
    }catch (error) {
        res.status(500).json({ message: `Internal server error ${error.message}` });
        console.log(error);
    };
});

//filter tasks by tags
app.get('/tasks/get-by-tags/:tag', async (req, res) => {
    const { tag } = req.params;
    // tag.toLowerCase();

    try {
        const tasks = await Task.findAll({ where: {tags: tag}});
        
        if(!tasks) {
            return res.status(400).json({ message: `No task found with the tag ${tag}`});
        }

        if(tasks.length === 1) {
            return res.status(200).json({ message: `1 task found with the tag`, tasks});
        };

        return res.status(200).json({ message: `${tasks.length} tasks found with the tag`, tasks});

    }catch (error) {
        res.status(500).json({ message: `Internal server error ${error.message}` });
        console.log(error);
    };
});


//                          COMMENTING SYSTEM
//users creating comments
app.post('/create-comment/:userId/:taskId', async (req, res) => {
    const { userId, taskId } = req.params;
    const {comment} = req.body;

    try{
        const user = await User.findOne({ where: {id: userId}});
        if(!user) {
            return res.status(404).json({ message: `User not found`});
        };

        const task = await Task.findOne({ where: {id: taskId}});
        if(!task) {
            return res.status(404).json({ message: `Task not found`});
        };

        if(!comment) {
            return res.status(404).json({ message: `Comment field cannot be empty`});
        };

        const newComment = {
            comment,
            userId,
            taskId
        };

        await Comment.create(newComment);
        return res.status(201).json({ message: `Comment created successfully`});

    }catch (error) {
        res.status(500).json({ message: `Internal server error ${error.message}` });
        console.log(error);
    };
});

//users can edit their own comments
app.patch('/comments/edit-comment/:userId/:commentId', async (req, res) => {
    const { userId, commentId } = req.params;
    const {comment} = req.body;

    try{ 
        const user = await User.findOne({ where: {id: userId}});
        if(!user) {
            return res.status(404).json({ message: `User not found`});
        };

        const comment = await Comment.findOne({ where: { id: commentId}});
        if(!comment) {
            return res.status(404).json({ message: `Comment not found`});
        };

        const checkComment = user.id === comment.userId;
        if(!checkComment) {
            return res.status(403).json({ message: `User cannot edit comment`});
        }

        await Comment.update({ comment}, { where: { id: commentId}});
        return res.status(200).json({ message: `Comment updated successfully`});

    }catch (error) {
        res.status(500).json({ message: `Internal server error ${error.message}` });
        console.log(error);
    };
});

//users can delete their own comments, admins can delete any comment
app.delete('/comments/delete-comment/:userId/:commentId', async (req, res) => {
    const { userId, commentId } = req.params;

    try{
        const user = await User.findOne({ where: {id: userId}});
        if(!user) {
            return res.status(404).json({ message: `User not found`});
        };

        const comment = await Comment.findOne({ where: { id: commentId}});
        if(!comment) {
            return res.status(404).json({ message: `Comment not found`});
        };

        if(user.role === 'admin') {
            await Comment.destroy({ where: { id: commentId}});
            return res.status(200).json({ message: `Comment deleted successfully`});
        };

        if(userId !== comment.userId) {
            return res.status(403).json({ message: `User cannot delete comment`});
        }

        await Comment.delete({ where: { id: commentId}});
        return res.status(200).json({ message: `Comment deleted successfully`});

    }catch (error) {
        res.status(500).json({ message: `Internal server error ${error.message}` });
        console.log(error);
    };
});











app.listen(PORT, async (req, res) => {
    try {
        await sequelize.sync();
        console.log('Connection has been established successfully');
    } catch (error) {
        console.log('Unable to connect to database', error);
    };
    console.log(`Server is running on port ${PORT}`);
});