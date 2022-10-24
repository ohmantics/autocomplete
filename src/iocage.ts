import { filepaths } from "@fig/autocomplete-generators";
import { zpoolGenerator } from "./zpool";

// TODO: what caching strategy for each generator?

const jailsGenerator: Fig.Generator = {
  script: "iocage list -qh | awk '{ print $1 }'",
  postProcess: function (out) {
    return out
      .split("\n")
      .map((jail) => ({
        name: jail,
        icon: "fig://icon?type=box",
        description: "Available jails", // TODO: could get notes property for each jail
      }));
  },
};

const releasesGenerator: Fig.Generator = {
  script: "iocage list --release -qh",
  postProcess: function (out) {
    return out
      .split("\n")
      .map((jail) => ({
        name: jail,
        icon: "fig://icon?type=box",
        description: "Available releases",
      }));
  },
};

const templatesGenerator: Fig.Generator = {
  script: "iocage list --template -qh",
  postProcess: function (out) {
    return out
      .split("\n")
      .map((jail) => ({
        name: jail,
        icon: "fig://icon?type=box",
        description: "Available templates",
      }));
  },
};

function checkForJailArgument(context: Array<string>) {
    // if we've seen a jail name argument and it's not the special ALL name
  return context
            .slice(2) // skip past the subcommand
            .find((value) => (!(value[0]=='-') && value != "ALL"));
}

const snapshotGenerator: Fig.Generator = {
  script(context) {
    var s = checkForJailArgument(context);
    return (s ? `iocage snaplist -h ${s} | cut -f 1` : null);
  },
  postProcess: function (out) {
    return out
      .split("\n")
      .map((snapshot) => ({
        name: snapshot,
        icon: "fig://icon?type=box",
        description: "Available snapshots",
      }));
  },
};

const fstabIndexGenerator: Fig.Generator = {
  script(context) {
    var s = checkForJailArgument(context);
    return (s ? `iocage fstab --list -h ${s} | cut -f 1` : null);
  },
  postProcess: function (out) {
    return out
      .split("\n")
      .map((idx) => ({
        name: idx,
        icon: "fig://icon?type=database",
        description: "Fstab indices",
      }));
  },
};

const regexExecAll = (str: string, regex: RegExp) => {
  let lastMatch: RegExpExecArray | null;
  const matches: RegExpExecArray[] = [];

  while ((lastMatch = regex.exec(str))) {
    matches.push(lastMatch);

    if (!regex.global) break;
  }

  return matches;
};

// TODO: probably want caching and maybe don't want history-based resorting
const downloadableReleasesGenerator: Fig.Generator = {
  custom: async (_, executeShellCommand) => {
    const out = await executeShellCommand("curl https://download.freebsd.org/ftp/releases/`uname -m`/");
    const dom = (new window.DOMParser()).parseFromString(out, "text/html")
    return Array.from(dom.getElementsByTagName("a"))
            .filter((tag) => tag.getAttribute("href").endsWith("-RELEASE/"))
            .map((tag) => ({
              name: tag.title,
              icon: "fig://icon?type=package",
              description: tag.title,
            }));
  },

  // script: "curl https://download.freebsd.org/ftp/releases/`uname -m`/",
  // postProcess: function (out) {
  //   // Parsing HTML with regexes is the way to madness, but iocage does similar
  //   // with their python code
  //   const regex = /^<tr>.*href=\"([^-]+-RELEASE)/gm;
  //   return regexExecAll(out, regex)
  //           .map(([, rel]) => ({ name: rel,
  //                                icon: "fig://icon?type=package",
  //                                description: rel }));
  // },
};

const usernameGenerator: Fig.Generator = {
  script: "cat /etc/passwd",
  postProcess: (out) => {
    // We want non-comment lines with UID >500.
    // ^(?!\s*#) // start of line negative for a comment line
    // Entries are shortname:password:uid:gid:fullname:homedir:shell
    // shortname: ([^:]+):
    // password (skipped): [^:]+:
    // uid: ([5-9]\d\d|\d{4,}):  // 3 digits starting with [5-9] or 4 or more digits
    // gid (skipped): \d+:
    // fullname: ([^:]+)
    // skip the rest: .*$
    const commentRegex = /^(?!\s*#)([^:]+):[^:]+:([5-9]\d\d|\d{4,}):\d+:([^:]+).*$/gm;
    return regexExecAll(out.trim(), commentRegex)
           .map(([, shortname, , fullname]) => ({ name: shortname,
                                                  icon: "👤",
                                                  description: fullname }));
  },
};

const helpOption: (arg0: string) => Fig.Option = (subcommand: string) => {
  return {
    name: ["-h", "--help"],
    description: `Show help for the iocage ${subcommand} subcomannd`,
    priority: 49,
  };
};

const compressionOption: (arg0: string) => Fig.Option = (verb: string) => {
  return {
      name: ["--compression", "-c"],
      description: `Choose which compression algorithm to use for ${verb} jail (zip/lzma)`,
      args: {
        name: "algorithm",
        description: "Compression algorithm",
        suggestions: [{
          name: "zip",
          description: "ZIP format with DEFLATE compression",
        },
        {
          name: "lzma",
          description: "XZ format with LZMA compression"
        }],
      },
  };
};

// TODO: fancy keyValue Property stuff for get/set subcommands

// interface Property<Type> {
//   theType: Type,
//   name: string,
//   description: string,
// }
// 
// const props : Array<Property<boolean |
//                              string>> = [
//   {
//     name: "foo",
//     description: "Bar",
//   } as Property<boolean>,
// 
// ];

const jailArg: Fig.Arg = {
  name: "JAIL",
  description: "Jail name",
  generators: jailsGenerator,
};

const jailOrAllArg: Fig.Arg = {
  ...jailArg,
  suggestions: ["ALL"],
};

const completionSpec: Fig.Spec = {
  name: "iocage",
  description: "A jail manager",
  subcommands: [{
    name: "activate",
    description: "Set a zpool active for iocage usage",
    options: [helpOption("activate")],
    args: {
      name: "zpool",
      generators: zpoolGenerator,
      description: "Zpool to activate",
    }
  },
  {
    name: "chroot",
    description: "Chroot to a jail",
    options: [helpOption("chroot")],
    args: [jailOrAllArg,
    {
      isCommand: true
    }],
  }, // chroot
  {
    name: "clean",
    description: "Destroy specified dataset types",
    options: [{
      name: ["--force", "-f"],
      description: "Runs the command with no further user interaction"
    },
    {
      name: ["--all", "-a"],
      description: "Destroy all iocage data that has been created"
    },
    {
      name: ["--jails", "-j"],
      description: "Destroy all jails created"
    },
    {
      name: ["--base", "-b", "-r"],
      description: "Destroy all RELEASEs fetched"
    },
    {
      name: ["--template", "-t"],
      description: "Destroy all templates"
    },
    {
      name: ["--images", "-i"],
      description: "Destroy all exports created"
    },
    {
      name: ["--debug", "-d"],
      description: "Destroy all debugs created in the default debug directory"
    },
    helpOption("clean")],
  }, // clean
  {
    name: "clone",
    description: "Clone a jail",
    args: jailArg,
    options: [{
      name: ["--count", "-c"],
      description: "Designate the number of cloned jails to create",
      args: {
        description: "Count of clones"
      },
    },
    {
      name: ["--name", "-n"],
      description: "Provide a specific name instead of an UUID for this jail",
      args: {
        description: "Name for new clone jail"
      },
    },
    {
      name: ["--newmac", "-N"],
      description: "Regenerate the clone's MAC address"
    },
    {
      name: ["--uuid", "-u"],
      description: "Provide a specific UUID for this jail",
      args: {
        description: "UUID for new clone jail",
      },
    },
    {
      name: ["--thickjail", "-T"],
      description: "Set the new jail type to a thickjail. Thickjails are copied (not cloned) from the specified target"
    },
    helpOption("clone")], // TODO: optional properties at the end
  }, // clone
  {
    name: "console",
    description: "Login to a jail",
    args: jailArg,
    options: [{
      name: ["--force", "-f"],
      description: "Start the jail if it's not running"
    },
    helpOption("console")],
  }, // console
  {
    name: "create",
    description: "Create a jail",
    options: [{
      name: ["--count", "-c"],
      description: "Designate a number of jails to create. Jails are numbered sequentially",
      args: {
        description: "Count of clones"
      },
    },
    {
      name: ["--thickconfig", "-C"],
      description: "Do not use inheritable configuration with jails"
    },
    {
      name: ["--release", "-r"],
      description: "Specify the RELEASE to use for the new jail",
      args: {
        name: "release",
        description: "Release for new jail",
        suggestions: ["latest"],
        generators: releasesGenerator,
      },
    },
    {
      name: ["--template", "-t"],
      description: "Specify the template to use for the new jail instead of a RELEASE",
      args: {
        name: "template",
        description: "Template for new jail",
        generators: templatesGenerator,
      },
    },
    {
      name: ["--pkglist", "-p"],
      description: "Specify a JSON file which manages the installation of each package in the newly created jail",
      args: {
        name: "file",
        description: "JSON file containing a pkg list",
        template: "filepaths",
      }
    },
    {
      name: ["--name", "-n"],
      description: "Provide a specific name instead of an UUID for this jail",
      args: {
        name: "name",
        description: "Name for the new jail"
      },
    },
    {
      name: ["--uuid", "-u"],
      description: "Provide a specific UUID for this jail",
      args: {
        name: "UUID",
        description: "UUID for the new jail",
        //suggestions: [randomUUID()]  // TODO: how do we generate a new UUID?
      },
    },
    {
      name: ["--proxy", "-S"],
      description: "Provide proxy to use for creating jail",
      args: {
        name: "proxy",
        description: "URL for HTTP proxy"
      },
    },
    {
      name: ["--basejail", "-b"],
      description: "Set the new jail type to a basejail. Basejails are thick jails (unless specified) that mount the specified RELEASE directories as nullfs mounts over the jail's directories"
    },
    {
      name: ["--clone_basejail", "-B"],
      description: "Set the new jail type to a clonetype basejail. Basejails mount the specified RELEASE directories as nullfs mounts over the jail's directories"
    },
    {
      name: ["--thickjail", "-T"],
      description: "Set the new jail type to a thickjail. Thickjails are copied (not cloned) from specified RELEASE"
    },
    {
      name: ["--empty", "-e"],
      description: "Create an empty jail used for unsupported or custom jails"
    },
    {
      name: ["--short", "-s"],
      description: "Use a short UUID of 8 characters instead of the default 36"
    },
    helpOption("create")], // TODO: add optional variadic properties
  }, // create
  {
    name: "debug",
    description: "Create a directory with all the debug for iocage jails",
    hidden: true,
    options: [{
      name: ["--directory", "-d"],
      description: "Directory to keep debug, defaults to mountpoint/debug",
      args: {
        name: "directory",
        description: "Directory to keep debug",
        template: "folders",
      },
    },
    helpOption("debug")],
  }, // debug
  {
    name: "destroy",
    description: "Destroy specified jails",
    args: jailArg,
    options: [{
      name: ["--force", "-f"],
      description: "Destroy the jail without warnings or more user input",
      isDangerous: true,
    },
    {
      name: ["--release", "-r"],
      description: "Destroy a specified RELEASE dataset",
      args: {
        name: "release",
        description: "RELEASE to destroy",
        generators: releasesGenerator,
      },
    },
    {
      name: ["--recursive", "-R"],
      description: "Bypass the children prompt, best used with --force (-f)"
    },
    {
      name: ["--download", "-d"],
      description: "Destroy the download dataset of the specified RELEASE as well"
    },
    helpOption("destroy")],
  }, // destroy
  {
    name: "df",
    description: "Show resource usage of all jails",
    options: [{
      name: ["--header", "-h", "-H"],
      description: "For scripting, use tabs for separators"
    },
    {
      name: ["--long", "-l"],
      description: "Show the full uuid",
    },
    {
      name: ["--sort", "-s"],
      description: "Sorts the list by the given type",
      args: {
        name: "type",
        description: "Sort type",
        suggestions: [{
          name: "NAME",
          description: "Jail name"
        },
        {
          name: "CRT",
          description: "Compression ratio",
        },
        {
          name: "RES",
          description: "Reserved space",
        },
        {
          name: "QTA",
          description: "Disk quota",
        },
        {
          name: "USE",
          description: "Used space",
        },
        {
          name: "AVA",
          description: "Available space",
        }],
      }
    },
    helpOption("df")],
  }, // df
  {
    name: "exec",
    description: "Run a command inside a specified jail",
    options: [{
      name: ["--host_user", "-u"],
      description: "The host user to use",
      args: {
        description: "Host user name",
      },
    },
    {
      name: ["--jail_user", "-U"],
      description: "The jail user to use",
      args: {
        description: "Jail user name"
      }
    },
    {
      name: ["--force", "-f"],
      description: "Start the jail if it's not running"
    },
    helpOption("exec")],
    args: [jailArg,
    {
      name: "COMMAND",
      description: "Command to execute in the JAIL",
      isCommand: true,
      isOptional: true, // without an arg, opens a shell like console does
    }],
  }, // exec
  {
    name:"export",
    description: "Exports a specified jail",
    options: [compressionOption("exporting"), helpOption("export")],
    args: jailArg,
  }, // export
  {
    name:"fetch",
    description: "Fetch a version of FreeBSD for jail usage or a preconfigured plugin",
    options: [{
      name: ["--file", "-f"],
      description: "Use a local file directory for root-dir instead of HTTP",
    },
    {
      name: ["--files", "-F"],
      description: "Specify the files to fetch from the mirror",
      args: {
        name: "file",
        description: "File to fetch from the mirror",
        template: "filepaths",
      },
      isRepeatable: true,
    },
    {
      name: ["--server", "-s"],
      description: "Server to fetch from",
      args: {
        name: "server",
        description: "Server to fetch from",
        suggestions: ["https://download.freebsd.org"],
      },
    },
    {
      name: ["--git_repository", "-g"],
      description: "Git repository to use to fetch plugin",
      args: {
        name: "repo",
        description: "Git repository",
        suggestions: ["https://github.com/freenas/iocage-ix-plugins.git"],
      },
    },
    {
      name: ["--keep_jail_on_failure", "-k"],
      description: "Keep jails on failure",
    },
    {
      name: ["--user", "-u"],
      description: "The user to use",
      args: {
        name: "user",
        description: "User name",
        generators: usernameGenerator,
      },
    },
    {
      name: ["--password", "-p"],
      description: "The password to use",
      args: {
        name: "password",
        description: "Password",
      },
    },
    {
      name: ["--auth", "-a"],
      description: "Authentication method for HTTP fetching. Valid values: basic, digest",
      args: {
        name: "auth",
        description: "HTTP Authentication Method",
        suggestions: ["basic", "digest"],
      },
    },
    {
      name: ["--verify", "-V"],
      description: "Enable verifying SSL cert for HTTP fetching",
    },
    {
      name: ["--noverify", "-NV"],
      description: "Disable verifying SSL cert for HTTP fetching",
    },
    {
      name: ["--release", "-r"],
      description: "The FreeBSD release to fetch",
      args: {
        name: "release",
        description: "FreeBSD release",
        generators: downloadableReleasesGenerator,
      },
    },
    {
      name: ["--plugin-name", "-P"],
      description: "Supply a plugin name for --plugins to fetch or use a auto completed filename for --plugin-name. Also accepts full path for a plugin file",
      args: {
        name: "plugin-name",
        description: "Plugin name or full path to a plugin file"
      },
    },
    {
      name: "--plugins",
      description: "List all available plugins for creation"
    },
    {
      name: "--count",
      description: "Designate a number of plugin type jails to create",
      args: {
        name: "count",
        description: "Plugin count"
      },
    },
    {
      name: ["--root-dir", "-d"],
      description: "Root directory containing all the RELEASEs",
      args: {
        name: "root-dir",
        description: "Root directory of the RELEASEs",
        template: "folders",  // TODO: could default to {iocroot}/iocage/download? Not sure if that's reasonable.
      },
    },
    {
      name: ["--update", "-U"],
      description: "Update the fetch to the latest patch level",
    },
    {
      name: ["--noupdate", "-NU"],
      description: "Do not update the fetch to the latest patch level",
    },
    {
      name: ["--eol", "-E"],
      description: "Enable EOL checking with upstream",
    },
    {
      name: ["--noeol", "-NE"],
      description: "Disable EOL checking with upstream",
    },
    {
      name: ["--name", "-n"],
      description: "Specify which jail name to use. Leave empty for default selection based on --plugin-name",
      args: {
        name: "name",
        description: "Jail name",
      },
    },
    {
      name: "--accept",
      description: "Accept the plugin's LICENSE agreement",
    },
    {
      name: "--noaccept",
      description: "Deny the plugin's LICENSE agreement",
    },
    {
      name: ["--offical", "-O"],
      description: "Lists only official plugins",
    },
    {
      name: "--branch",
      description: "Select a different plugin branch (for development)",
      args: {
        name: "branch",
        description: "Plugin branch",
      },
    },
    {
      name: ["--thickconfig", "-C"],
      description: "Do not use inheritable configuration with plugins",
    },
    {
      name: ["--proxy", "-S"],
      description: "Provide proxy to use for creating jail",
      args: {
        name: "proxy",
        description: "HTTP proxy"
      },
    },
    {
      name: ["--http", "-h"],
      description: "No-op flag for backwards compat",
      hidden: true,
      deprecated: true,
    },
    helpOption("fetch")],
  }, // fetch
  {
    name:"fstab",
    description: "Manipulate the specified jails fstab",
    options: [{
      name: ["--add", "-a"],
      description: "Adds an entry to the jails fstab and mounts it",
    },
    {
      name: ["--remove", "-r"],
      description: "Removes an entry from the jails fstab and unmounts it",
    },
    {
      name: ["--edit", "-e"],
      description: "Opens up the fstab file in your environments EDITOR",
    },
    {
      name: ["--replace", "-R"],
      description: "Replace an entry by index number",
      args: {
        name: "fstab index",
        description: "Index number of fstab entry to replace",
        generators: fstabIndexGenerator,
      }
    },
    {
      name: ["--header", "-h", "-H"],
      description: "For scripting, use tabs for separators",
    },
    helpOption("fstab")],
    args: [jailArg,
    {
      name: "Device",
      description: "Source device or path",
      template: "filepaths",  // TODO: should default somewhere? ZFS datasets?
    },
    {
      name: "mountpoint",
      description: "Destination mount path",
      template: "filepaths",  // TODO: should default to a path under the root path for the named jail {iocroot}/jails/JAILNAME/root/mnt/
    },
    {
      name: "vfstype",
      description: "VFS Type for mount",
      suggestions: ["nullfs"],  // TODO: can we get a real list of this dynamically somewhere?
    },
    {
      name: "options",
      description: "Mount type and options, comma-separated",
      suggestions: ["rw", "ro", "rq", "sw", "xx"],  // TODO: can we get this list dynamically somewhere?
    },
    {
      name: "dump",
      description: "Dump frequency (usually 0)",
      suggestions: ["0"],
    },
    {
      name: "pass",
      description: "Pass number for parallel fsck (usually 0)",
      suggestions: ["0"],
    }]
  }, // fstab
  {
    name:"get",
    description: "Gets the specified property",
    options: [{
      name: ["--header", "-h", "-H"],
      description: "For scripting, use tabs for separators",
    },
    {
      name: ["--recursive", "-r"],
      description: "Get the specified property for all jails",
    },
    {
      name: ["--plugin", "-P"],
      description: "Get the specified key for a plugin jail, if accessing a nested key use . as a separator. Example: iocage get -P foo.bar.baz PLUGIN",
    },
    {
      name: ["--all", "-a"],
      description: "Get all properties for the specified jail",
    },
    {
      name: ["--pool", "-p"],
      description: "Get the currently activated zpool",
    },
    {
      name: ["--state", "-s"],
      description: "Get the jails state",
    },
    {
      name: ["--jid", "-j"],
      description: "Get the jails jid",
    },
    {
      name: ["--force", "-f"],
      description: "Start the jail for plugin properties if it's not running",
    },
    helpOption("get")],
    args: [{
      name: "property",
      description: "Property to get",
    },
    jailArg]
  }, // get
  {
    name:"import",
    description: "Import a specified jail",
    options: [compressionOption("importing"),
    {
      name: ["--path", "-p"],
      description: "Specify directory where exported jail lives or absolute path to import jail",
      args: {
        name: "Jail image",
        description: "Jail image to import",
        // path can be the directory where JAIL is, or an absolute path to the compressed image file
        // if absolute path including filename, JAIL will be the starting characters of the filename, extensions at the end.
        // TODO should default to {iocroot}/images
        generators: filepaths({ suggestFolders: "always",
                                extensions: ["zip", "tar.xz"] }),
      }
    },
    helpOption("import")],
    args: jailArg,  // TODO: this feels wrong
  }, // import
  {
    name: "list",
    description: "List a specified dataset type, by default lists all jails",
    options: [{
      name: ["--release", "-r", "--base", "-b"],
      description: "List all bases", 
    },
    {
      name: ["--basejails", "-B"],
      description: "List all basejails",
    },
    {
      name: ["--template", "-t"],
      description: "List all templates",
    },
    {
      name: ["--header", "-h", "-H"],
      description: "For scripting, use tabs for separators",
    },
    {
      name: ["--long", "-l"],
      description: "Show the full uuid and ip4 address",
    },
    {
      name: ["--remote", "-R"],
      description: "Show remote's available RELEASES",
    },
    {
      name: ["--plugins", "-P"],
      description: "Show available plugins",
    },
    {
      name: "--http",
      description: "Have --remote use HTTP instead",
    },
    {
      name: ["--sort", "-s"],
      description: "Sorts the list by the given type",
      args: {
        name: "type",
        description: "Sort type",
        suggestions: [{
          name: "jid",
          description: "Jail ID",
        },
        {
          name: "name",
          description: "Jail name",
        },
        {
          name: "state",
          description: "Jail state",
        },
        {
          name: "release",
          description: "Jail release",
        },
        {
          name: "ip4",
          description: "Jail IPv4 address"
        }],
      },
    },
    {
      name: ["--quick", "-q"],
      description: "List all jails with less processing and fields",
    },
    {
      name: ["--official", "-O"],
      description: "Lists only official plugins",
    },
    helpOption("list")]
  }, // list
  {
    name:"migrate",
    description: "Migrate all iocage_legacy develop basejails to new clonejails",
    options: [{
      name: ["--force", "-f"],
      description: "Bypass the interactive question",
      isDangerous: true,
    },
    {
      name: ["--delete", "-d"],
      description: "Delete the old dataset after it has been migrated",
    },
    helpOption("migrate")],
  }, // migrate
  {
    name:"pkg",
    description: "Use pkg inside a specified jail",
    options: [helpOption("pkg")],
    args: {
      ...jailArg,           // jailOrAllArg plus the loadSpec below
      suggestions: ["ALL"],
      loadSpec: "pkg",      // This presents pkg's subcommands after the jail name
    },
  }, // pkg
  {
    name:"rename",
    description: "Rename a jail",
    options: [helpOption("rename")],
    args: [jailArg,
    {
      name: "new name",
      description: "New name"
    }]
  }, // rename
  {
    name:"restart",
    description: "Restarts the specified jails or ALL",
    options: [{
      name: ["--soft", "-s"],
      description: "Restarts the jail but does not tear down the network stack",
    },
    helpOption("restart")],
    args: jailOrAllArg,
  }, // restart
  {
    name:"rollback",
    description: "Rollbacks the specified jail",
    options: [{
      name: ["--name", "-n"],
      description: "The snapshot name. This will be what comes after @",
      isRequired: true,
      args: {
        name: "snapshot name",
        description: "Snapshot name",
        generators: snapshotGenerator,
      },
    },
    {
      name: ["--force", "-f"],
      description: "Skip the interactive question",
      isDangerous: true,
    },
    helpOption("rollback")],
    args: jailArg,
  }, // rollback
  {
    name:"set",
    description: "Sets the specified property",
    options: [{
      name: ["--plugin", "-P"],
      description: "Set the specified key for a plugin jail, if accessing a nested key use . as a separator. Example: iocage set -P foo.bar.baz=VALUE PLUGIN",
    },
    helpOption("set")],
    args: [{
      name: "property",
      description: "Property to set (key=value)",
      // TODO: how do we say that this property can repeat?
    },
    jailArg]
  }, // set
  {
    name:"snaplist",
    description: "Show snapshots of a specified jail",
    options: [{
      name: ["--header", "-h", "-H"],
      description: "For scripting, use tabs for separators"
    },
    {
      name: ["--long", "-l"],
      description: "Show the full dataset path for snapshot name"
    },
    {
      name: ["--sort", "-s"],
      description: "Sorts the list by the given type",
      args: {
        name: "sort type",
        description: "Sort type",
        suggestions: [{
          name: "NAME",
          description: "Snapshot name",
        },
        {
          name: "CREATED",
          description: "Creation time",
        },
        {
          name: "RSIZE",
          description: "Referenced size",
        },
        {
          name: "USED",
          description: "Used space",
        }],
      },
    },
    helpOption("snaplist")],
    args: jailArg,
  }, // snaplist
  {
    name:"snapremove",
    description: "Remove specified snapshot of a jail",
    options:[{
      name: ["--name", "-n"],
      description: "The snapshot name. This will be what comes after @",
      isRequired: true,
      args: {
        name: "snapshot name",
        description: "Snapshot name",
        generators: snapshotGenerator,
      },
    },
    helpOption("snapremove")],
    args: jailOrAllArg,
  }, // snapremove
  {
    name:"snapshot",
    description: "Snapshots the specified jail",
    options:[{
      name: ["--name", "-n"],
      description: "The snapshot name. This will be what comes after @",
      isRequired: true,
      args: {
        name: "snapshot name",
        description: "Snapshot name",
      },
    },
    helpOption("snapshot")],
    args: jailArg,
  }, // snapshot
  {
    name: "start",
    description: "Starts the specified jails or ALL",
    args: jailOrAllArg,
    options: [{
      name: "--rc",
      description: "Will start all jails with boot=on, in the specified order with smaller value for priority starting first",
    },
    {
      name: ["--ignore", "-i"],
      description: "Suppress exceptions for jails which fail to start",
    },
    helpOption("start")],
  }, // start
  {
    name: "stop",
    description: "Stops the specified jails or ALL",
    args: jailOrAllArg,
    options: [{
      name: "--rc",
      description: "Will stop all jails with boot=on, in the specified order with higher value for priority stopping first",
    },
    {
      name: ["--force", "-f"],
      description: "Skips all pre-stop actions like stop services. Gently shuts down and kills the jail process"
    },
    {
      name: ["--ignore", "-i"],
      description: "Suppress exceptions for jails which fail to stop",
    },
    helpOption("stop")],
  }, // stop
  {
    name:"update",
    description: "Run freebsd-update to update a specified jail to the latest patch level",
    options: [{
      name: ["--pkgs", "-P"],
      description: "Decide whether or not to update the pkg repositories and all installed packages in jail( this has no effect for plugins )"
    },
    helpOption("update")],
    args: jailOrAllArg,
  }, // update
  {
    name:"upgrade",
    description: "Run freebsd-update to upgrade a specified jail to the RELEASE given",
    options: [{
      name: ["--release", "-r"],
      description: "RELEASE to upgrade to",
      args: {
        name: "RELEASE",
        description: "RELEASE to upgrade to",
        generators: releasesGenerator,
      }
    },
    helpOption("upgrade")],
    args: jailOrAllArg,
  }, // upgrade

  ],
  options: [{
    name: ["--version", "-v"],
    description: "Display iocage's version and exit",
  },
  {
    name: ["--force", "-f"],
    description: "Allow iocage to rename datasets",
  },
  {
    name: ["--debug", "-D"],
    description: "Log debug output to the console",
    hidden: true,
  },
  {
    name: ["--help", "-h"],
    description: "Show help for iocage",
    priority: 49,
  }],
  // Only uncomment if iocage takes an argument
  // args: {}
};
export default completionSpec;

// TODO: check all subcommands taking a JAIL for compatibility with ALL
// TODO: check that subcommands taking a JAIL force the argument or not as needed (e.g. iocage get --pool doesn't need a JAIL)