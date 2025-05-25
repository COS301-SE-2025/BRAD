const users = [];

exports.addUser = (user) => users.push(user);
exports.findUser = (username) => users.find(u => u.username === username);
