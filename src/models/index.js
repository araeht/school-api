import { Sequelize } from 'sequelize';
import dbConfig from '../config/db.config.js';
import StudentModel from './student.model.js';
import CourseModel from './course.model.js';
import TeacherModel from './teacher.model.js';

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    port: dbConfig.PORT,
    dialect: dbConfig.dialect,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Initialize models
db.Student = StudentModel(sequelize, Sequelize);
db.Course = CourseModel(sequelize, Sequelize);
db.Teacher = TeacherModel(sequelize, Sequelize);

// Define associations
// Teacher-Course relationship (One-to-Many)
db.Teacher.hasMany(db.Course, {
    foreignKey: 'TeacherId',
    as: 'courses'
});
db.Course.belongsTo(db.Teacher, {
    foreignKey: 'TeacherId',
    as: 'teacher'
});

// Student-Course relationship (Many-to-Many)
db.Course.belongsToMany(db.Student, { 
    through: "CourseStudent",
    as: 'students',
    foreignKey: 'CourseId',
    otherKey: 'StudentId',
    timestamps: true // Track enrollment dates
});
db.Student.belongsToMany(db.Course, { 
    through: "CourseStudent",
    as: 'courses',
    foreignKey: 'StudentId',
    otherKey: 'CourseId',
    timestamps: true
});

// Optional: Add enrollment model for additional enrollment data
const CourseStudent = sequelize.define('CourseStudent', {
    enrollmentDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },
    status: {
        type: Sequelize.ENUM('enrolled', 'completed', 'dropped', 'failed'),
        allowNull: false,
        defaultValue: 'enrolled'
    },
    grade: {
        type: Sequelize.STRING(5),
        allowNull: true,
        comment: 'Final grade (A, B, C, D, F, etc.)'
    },
    score: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        validate: {
            min: 0,
            max: 100
        }
    }
}, {
    timestamps: true,
    indexes: [
        {
            fields: ['StudentId', 'CourseId'],
            unique: true
        },
        {
            fields: ['status']
        },
        {
            fields: ['enrollmentDate']
        }
    ]
});

// Make the junction table available
db.CourseStudent = CourseStudent;

// Sync database (use with caution in production)
if (process.env.NODE_ENV === 'development') {
    await sequelize.sync({ alter: true });
    console.log('Database synced in development mode');
} else {
    // In production, use migrations instead
    await sequelize.authenticate();
    console.log('Database connection established');
}

export default db;