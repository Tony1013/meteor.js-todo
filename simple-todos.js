Tasks = new Mongo.Collection("tasks");

if (Meteor.isServer) {
  //this code only runs on the server
  //this code only publishes tasks that are public or belong to the current user
  Meteor.publish("tasks", function (){
    return Tasks.find({
      $or: [
        { private: {$ne: true} },
        { owner: this.userId }
      ]
  });
  });
}

if (Meteor.isClient) {
      // This code only runs on the client
      Meteor.subscribe("tasks");

        Template.body.helpers({
          tasks: function () {
            if (Session.get("hideCompleted")) {
              // If hide completed is checked, filter tasks
              return Tasks.find({checked: {$ne: true}}, {sort: {createdAt: -1}});
            } else {
              // Otherwise, return all of the tasks
              return Tasks.find({}, {sort: {createdAt: -1}});
            }
          },
          hideCompleted: function () {
            return Session.get("hideCompleted");
          },
          incompleteCount: function () {
            return Tasks.find({checked: {$ne: true}}).count();
          }
        });

  Template.body.events({
    "submit .new-task": function (event) {
      //prevent default browser form submit
      event.preventDefault();

      //get value from form element
      var text = event.target.text.value;

      //Insert task into the Collection
      Meteor.call ("addTask", text);

      //Clear form
      event.target.text.value = "";
    },
    "change .hide-completed input": function (event) {
      Session.set("hideCompleted", event.target.checked);
    }
  });

  Template.task.helpers({
    isOwner: function () {
      return this.owner === Meteor.userId();
    }
  });

  Template.task.events({
    "click .toggle-checked": function () {
      //set the text property to the opposite of its current value
      Meteor.call("setChecked", this._id, ! this.checked);
    },
    "click .delete": function () {
      Meteor.call("deleteTask", this._id);
    },
    "click .toggle-private": function () {
      Meteor.call("setPrivate", this._id, ! this.private);
    }
  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });
}

Meteor.methods({
  addTask: function (text) {
    //make sure the user is logged in bfore adding a tasks
    if ( ! Meteor.userId ()) {
      throw new Meteor.Error("not-authorized");
    }

    Tasks.insert (text) ({
      text: text,
      createdAt: new Date(),
      owner: Meteor.userId,
      username: Meteor.user().username
    });
  },
  deleteTask: function (taskId) {
    Tasks.remove(taskId);
  },
  setChecked: function (taskId, setChecked) {
    Tasks.update (taskId, { $set: { checked: setChecked} });
  },

  setPrivate: function(taskId, setToPrivate) {
    var task = Task.findOne(TaskId);

    //make sure only a task owner can set a task to private
    if (task.owner !== Meteor.UserId()) {
    throw new Meteor.Error("not-authorized");
  }
}
});
