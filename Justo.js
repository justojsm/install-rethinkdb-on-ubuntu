//imports
const justo = require("justo");
const catalog = justo.catalog;
const apt = require("justo-plugin-apt");
const cli = require("justo-plugin-cli");
const fs = require("justo-plugin-fs");
const sync = require("justo-sync");
const getos = require("getos");

//private data
const PKG = "rethinkdb";

//catalog
catalog.workflow({name: "install", desc: "Install RethinkDB."}, function() {
  var os;

  //(1) get OS info
  os = sync((done) => getos(done));

  if (os.os != "linux" || !/Ubuntu/.test(os.dist))  {
    throw new Error("Distribution not supported by this module.");
  }

  //(2) install
  if (!apt.installed("Check whether RethinkDB installed", {name: PKG})) {
    //(2.1) install dependencies for installing
    if (!apt.installed("Check whether wget installed", {name: "wget"})) {
      apt.install("Install wget package", {name: "wget"});
    }

    //(1.2) add package source if needed
    if (!fs.exists("Check whether /etc/apt/sources.list.d/rethinkdb.list exists", {src: "/etc/apt/sources.list.d/rethinkdb.list"})) {
      cli("Create /etc/apt/sources.list.d/rethinkdb.list", {
        cmd: "bash",
        args: ["-c", "source /etc/lsb-release && echo \"deb http://download.rethinkdb.com/apt $DISTRIB_CODENAME main\" | tee /etc/apt/sources.list.d/rethinkdb.list"],
      });
    }

    cli("Add APT key", {
      cmd: "bash",
      args: ["-c", "wget -qO- https://download.rethinkdb.com/apt/pubkey.gpg | apt-key add -"]
    });

    apt.update("Update APT index");
    if (!apt.available(`Check whether ${PKG} package available`, {name: PKG})) return;

    //(2.3) install RethinkDB
    apt.install("Install RethinkDB", {
      name: PKG
    });
  }

  //(3) post
  cli("Check rethinkdb command", {
    cmd: "bash",
    args: ["-c", "rethinkdb --version"]
  });
});

catalog.macro({name: "default", desc: "Install RethinkDB and its dependencies."}, ["install"]);
