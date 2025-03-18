/**
 * @class User
 * @description User object
 */
class User {
  /**
   * Creates a User instance.
   * @param {string} id - ID of the User
   * @param {string} name - name for the User
   * @param {string} email - The user email
   * @param {string} phone - the phone number of the user (including country code)
   */
  constructor(id, name, email, phone) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.phone = phone;
  }
}

module.exports = User;
