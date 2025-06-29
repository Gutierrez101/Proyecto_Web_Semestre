export default class User {
  static ROLES = { STUDENT: "STUDENT", TEACHER: "TEACHER" };

  constructor({ id, name, email, role = User.ROLES.STUDENT, avatarUrl = "" }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.role = role;
    this.avatarUrl = avatarUrl;
  }

  changeAvatar(url) {
    this.avatarUrl = url;
  }

  get avatar() {
    return this.avatarUrl || "/default-avatar.png";
  }
}