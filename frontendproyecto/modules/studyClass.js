import Lesson from "./lesson.js";

export default class StudyClass {
  lessons = [];

  constructor({ id, title, owner, description = "" }) {
    this.id = id;
    this.title = title;
    this.owner = owner; // instancia User
    this.description = description;
  }

  addLesson(lesson) {
    if (lesson instanceof Lesson) this.lessons.push(lesson);
  }
}