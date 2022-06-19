describe("Blog app", function () {
  beforeEach(function () {
    // Reset db to start test with a "default" db
    cy.request("POST", "http://localhost:3003/api/testing/reset");

    // Create new user
    const user = {
      username: "admin",
      password: "abc123",
      name: "admin",
    };
    cy.request("POST", "http://localhost:3003/api/users/", user);

    // Visit the page to test
    cy.visit("http://localhost:3000");
  });

  // Test if login form is shown by default
  it("Login form is shown", function () {
    cy.contains("log in to application");
    cy.contains("Login").click();
  });

  describe("Login", function () {
    it("succeeds with correct credentials", function () {
      cy.get("#username").type("admin");
      cy.get("#password").type("abc123");
      cy.get("#login-button").click();

      cy.contains("Logged in");
    });

    it("fails with wrong credentials", function () {
      cy.get("#username").type("abc");
      cy.get("#password").type("abc");
      cy.get("#login-button").click();

      cy.contains("wrong username or password");
    });
  });

  describe("When logged in", function () {
    beforeEach(function () {
      // Login user
      cy.request("POST", "http://localhost:3003/api/login", {
        username: "admin",
        password: "abc123",
      }).then(({ body }) => {
        localStorage.setItem("loggedUser", JSON.stringify(body));
        cy.visit("http://localhost:3000");
      });
    });

    it("A blog can be created", function () {
      cy.contains("create new blog").click();
      cy.get("#title").type("test-auto-title");
      cy.get("#author").type("test-auto-author");
      cy.get("#url").type("test-auto-url");

      cy.get("#create-button").click();

      cy.contains("test-auto-title test-auto-author");
    });

    describe("And a blog exsit", function () {
      beforeEach(function () {
        // Create a blog using custom cypress command
        cy.createBlog({
          title: "Auto Title",
          author: "Auto Author",
          url: "Auto url",
        });
      });

      it("A user can like a blog", function () {
        cy.contains("view").click();
        cy.contains("like").click();
      });

      it("A user can delete a blog", function () {
        cy.contains("view").click();
        cy.contains("remove").click();
        cy.contains("deleted blog");
      });

      it("Other user can't delete other user's blog", function () {
        // Logout from current user
        cy.contains("logout").click();

        // Create a new user
        const user = {
          username: "admin2",
          password: "abc123",
          name: "admin2",
        };
        cy.request("POST", "http://localhost:3003/api/users/", user);

        // Login user
        cy.request("POST", "http://localhost:3003/api/login", {
          username: "admin2",
          password: "abc123",
        }).then(({ body }) => {
          localStorage.setItem("loggedUser", JSON.stringify(body));
          cy.visit("http://localhost:3000");
        });

        // Check blog didn't have remove button
        cy.contains("view").click();
        cy.contains("Auto Title Auto Author").should("not.contain", "remove");
      });
    });
  });
});
