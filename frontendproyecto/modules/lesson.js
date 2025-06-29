export default class Lesson {
  constructor({ id, title, summary, resources = [] }) {
    this.id = id;
    this.title = title;
    this.summary = summary;
    this.resources = resources;
  }
}