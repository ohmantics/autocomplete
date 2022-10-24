import { filepaths } from "@fig/autocomplete-generators"

const jailNameGenerator: Fig.Generator = {
  script: "jls --libxo json",
  postProcess: function (out) {
    return JSON.parse(out)['jail-information'].jail
            .map((jail) => ({
              name: jail.hostname,
              icon: "fig://icon?type=box",
              description: `Jail \'${jail.hostname}\' (jid #${jail.jid})`
            }));
  }
};

const jailIDGenerator: Fig.Generator = {
  script: "jls --libxo json",
  postProcess: function (out) {
    return JSON.parse(out)['jail-information'].jail
            .map((jail) => ({
              name: jail.jid,
              icon: "fig://icon?type=box",
              description: `Jail \'${jail.hostname}\' (jid #${jail.jid})`
            }));
  }
};

const outputFormatSuggestionList: Fig.Suggestion[] =  [
  { name: "json", description: "JSON format", },
  { name: "json-compact", description: "Compact JSON format", },
  { name: "ucl", description: "Universal Configuration Language format", },
  { name: "yaml", description: "YAML format", }
];

const completionSpec: Fig.Spec = {
  name: "pkg",
  description: "A utility for manipulating packages",
  subcommands: [{
    name: "add",
    description: "Compatibility interface to install a package",
    options: [{
      name: ["--automatic", "-A"],
      description: "Mark the installed packages as automatic",
    },
    {
      name: ["--force", "-f"],
      description: "Force the reinstallation of the	package	if already installed",
    },
    {
      name: ["--no-scripts", "-I"],
      description: "If any installation scripts (pre-install or post-install) exist for	given packages,	do not execute them",
    },
    {
      name: ["--accept-missing", "-M"],
      description: "Force the installation of the package with missing dependencies",
    },
    {
      name: ["--quiet", "-q"],
      description: "Force quiet operation",
    },
    {
      name: "--relocate",
      description: "Annotates the package as having	been relocated to location, which is an alternate system root",
      deprecated: true,
      hidden: true,
      args: {
        name: "location",
        description: "Alternate root directory",
        template: "folders",
      }
    }],
    args: {
      name: "package",
      description: "Package to add and install",
      isRepeatable: true,
    }
  },
  {
    name: "alias",
    description: "List the command line aliases",
    options: [{
      name: ["--list", "-l"],
      description: "Print all aliases, one alias per line, without their arguments",
    },
    {
      name: ["--quiet", "-q"],
      description: "Force quiet	output (suppress column	headers)",
    }],
    args: {
      name: "alias",
      description: "Alias to show",
      isOptional: true,
    }
  },
  {
    name: "annotate",
    description: "Add, modify or delete tag-value style annotations on packages",
    options: [{
      name: ["--all", "-a"],
      description: "Annotate all installed packages"
    },
    {
      name: ["--add", "-A"],
      description: "Add a new annotation",
    },
    {
      name: ["--case-sensitive", "-C"],
      description: "Make the standard or the regular expression (-x) matching against pkg-name case sensitive"
    },
    {
      name: ["--delete", "-D"],
      description: "Delete an annotation",
    },
    {
      name: ["--glob", "-g"],
      description: "Treat pkg-name as a shell glob pattern"
    },
    {
      name: ["--case-insensitive", "-i"],
      description: "Make the standard or the regular expression (-x) matching against pkg-name case insensitive"
    },
    {
      name: ["--modify", "-m"],
      description: "Modify an existing annotation",
    },
    {
      name: ["--quiet", "-q"],
      description: "Operate quietly: do not output anything other than confirmatory questions",
    },
    {
      name: ["--show", "-s"],
      description: "Display the annotation identified by tag for each matched package",
    },
    {
      name: ["--regex", "-x"],
      description: "Treat pkg-name as a regular expression according to the \"modern\" or	\"extended\" syntax of re_format(7)",
    },
    {
      name: ["--yes", "-y"],
      description: "Assume \"yes\" as the answer	to all questions",
    }],
    args: [{
      name: "pkg-name",
      description: "Package to annotate",
      // TODO: only for add/modify/show/delete
    },
    {
      name: "tag",
      description: "Tag to annotate",
      isRequired: true,
    },
    {
      name: "value",
      description: "Value to set tag to",
      isOptional: true,
      // TODO: only for add/modify
    }]
  },
  {
    name: "audit",
    description: "Reports vulnerable packages",
    options: [{
      name: ["--fetch", "-F"],
      description: "Fetch the database before checking",
    },
    {
      name: ["--file", "-f"],
      description: "Use filename as the local copy of the vulnerability database",
      args: {
        name: "filename",
        description: "Vulnerability database file",
        template: "filepaths",
      },
    },
    {
      name: ["--quiet", "-q"],
      description: "Prints only the requested information	without	displaying many hints",
    },
    {
      name: "--raw",
      description: "Present the output in the specified format",
      requiresEquals: true,
      args: {
        suggestions: outputFormatSuggestionList,
      },
    },
    {
      name: "-R",
      description: "Present the output in the specified format",
      requiresSeparator: '',
      args: {
        suggestions: outputFormatSuggestionList,
      },
    },
    {
      name: ["--recursive", "-r"],
      description: "Prints packages that depend on vulnerable packages and are thus potentially vulnerable as well"
    }],
    args: {
      name: "pkg-name",
      description: "Package to audit",
      // TODO: offer installed pkgs?
    }
  },
  {
    name: "autoremove",
    description: "Removes orphan packages",
    options: [{
      name: ["--dry-run", "-n"],
      description: "Dry-run mode. The list of changes to packages is always printed, but no changes are actually made"
    },
    {
      name: ["--no-scripts", "-D"],
      description: "If a deinstallation script exists	for a given package, do	not execute it",
    },
    {
      name: ["--quiet", "-q"],
      description: "Force quiet output"
    },
    {
      name: ["--yes", "-y"],
      description: "Assume yes when asked for	confirmation before package autoremoval",
    }]
  },
  {
    name: "backup",
    description: "Backs-up and restores the local package database",
    options: [{
      name: ["--dump", "-d"],
      description: "Dumps the	local package database to a file specified on the command-line",
      args: {
        name: "dest_file",
        description: "File to dump to",
        template: "filepaths",
      },
    },
    {
      name: ["--quiet", "-q"],
      description: "Force quiet output",
    },
    {
      name: ["--restore", "-r"],
      description: "Uses src_file in order to	restore	the local package database",
      args: {
        name: "src_file",
        description: "File to restore",
        template: "filepaths",
      }
    }]
  },
  {
    name: "check",
    description: "Checks for missing dependencies and database consistency",
    options: [{
      name: ["--all", "-a"],
      description: "Process all packages",
      // TODO: should not require an argument if this is present
    },
    {
      name: ["--shlibs", "-B"],
      description: "Regenerates the library dependency metadata for a package",
    },
    {
      name: ["--case-sensitive", "-C"],
      description: "Use case sensitive standard or regular expression (-x) matching with pattern",
    },
    {
      name: ["--dependencies", "-d"],
      description: "Checks for and installs missing dependencies",
    },
    {
      name: ["--glob", "-g"],
      description: "Treat pattern as a shell glob pattern",
    },
    {
      name: ["--case-insensitive", "-i"],
      description: "Use case insensitive standard or regular expression (-x) matching with pattern",
    },
    {
      name: ["--dry-run", "-n"],
      description: "Only check for missing dependencies, do not install them",
    },
    {
      name: ["--recompute", "-r"],
      description: "Recalculates and sets the checksums of installed packages",
    },
    {
      name: ["--checksums", "-s"],
      description: "Detects installed packages with invalid checksums",
    },
    {
      name: ["--verbose", "-v"],
      description: "Be verbose",
    },
    {
      name: ["--quiet", "-q"],
      description: "Suppress most output, except for error messages and data that	the command explicitly requests",
    },
    {
      name: ["--regex", "-x"],
      description: "Treat pattern as a regular expression, using the \"modern\" or \"extended\" syntax described in re_format(7)",
    },
    {
      name: ["--yes", "-y"],
      description: "Assume \"yes\" when asked for confirmation before installing missing dependencies",
    }],
    args: {
      name: "pattern",
      description: "Pattern to match packages",
      // TODO: should only be here if not "--all"
    }
  },
  {
    name: "clean",
    description: "Cleans old packages from the cache",
    options: [{
      name: ["--all", "-a"],
      description: "Delete all cached packages including those, which have not been superseded by newer versions yet and are still in use"
    },
    {
      name: ["--dry-run", "-n"],
      description: "Do not delete any package files from the cache, but show what would be done instead",
    },
    {
      name: ["--quiet", "-q"],
      description: "Be quiet. Suppress most output. All output is suppressed if -y is also used",
    },
    {
      name: ["--yes", "-y"],
      description: "Assume \"yes\" when asked for confirmation before deleting any out of	date or	redundant packages from	the cache",
    }],
  },
  {
    name: "config",
    description: "Display the value of the configuration options",
    args: {
      name: "name",
      description: "Configuration option to retrieve",
    }
  },
  {
    name: "create",
    description: "Creates software package distributions",
  },
  {
    name: "delete",
    description: "Deletes packages from the database and the system",
  },
  {
    name: "fetch",
    description: "Fetches packages from a remote repository",
  },
  {
    name: "help",
    description: "Displays help information",
  },
  {
    name: "info",
    description: "Displays information about installed packages",
  },
  {
    name: "install",
    description: "Installs packages from remote package repositories and local archives",
  },
  {
    name: "lock",
    description: "Locks package against modifications or deletion",
  },
  {
    name: "plugins",
    description: "Manages plugins and displays information about plugins",
  },
  {
    name: "query",
    description: "Queries information about installed packages",
  },
  {
    name: "register",
    description: "Registers a package into the local database",
  },
  {
    name: "remove",
    description: "Deletes packages from the database and the system",
  },
  {
    name: "repo",
    description: "Creates a package repository catalogue",
  },
  {
    name: "rquery",
    description: "Queries information in repository catalogues",
  },
  {
    name: "search",
    description: "Performs a search of package repository catalogues",
  },
  {
    name: "set",
    description: "Modifies information about packages in the local database",
  },
  {
    name: "ssh",
    description: "Package server (to be used via ssh)",
  },
  {
    name: "shell",
    description: "Opens a debug shell",
  },
  {
    name: "shlib",
    description: "Displays which packages link against a specific shared library",
  },
  {
    name: "stats",
    description: "Displays package database statistics",
  },
  {
    name: "triggers",
    description: "Execute deferred triggers",
  },
  {
    name: "unlock",
    description: "Unlocks a package, allowing modification or deletion",
  },
  {
    name: "update",
    description: "Updates package repository catalogues",
  },
  {
    name: "updating",
    description: "Displays UPDATING information for a package",
  },
  {
    name: "upgrade",
    description: "Performs upgrades of packaged software distributions",
  },
  {
    name: "version",
    description: "Displays the versions of installed packages",
  },
  {
    name: "which",
    description: "Displays which package installed a specific file",
  }],
  options: [{
    name: ["--version", "-v"],
    description: "Display the current version of pkg",
    isRepeatable: 2,
  },
  {
    name: ["--debug", "-d"],
    description: "Show debug information",
    isRepeatable: 4,
  },
  {
    name: ["--list", "-l"],
    description: "List all the available command names, and exit without performing any other action",
  },
  {
    name: "-N",
    description: "Test if pkg(8) is activated and avoid auto-activation",
  },
  {
    name: ["--option", "-o"],
    description: "Set configuration option for pkg from the command line (option=value)",
    args: {
      name: "option",
      description: "Option to set (option=value)",
      // TODO: do some fancy keyValue thing?
    },
    isRepeatable: true,
  },
  {
    name: ["--jail", "-j"],
    description: "Execute pkg in the given <jail name or id>",
    generators: jailNameGenerator,
  },
  {
    name: ["--chroot", "-c"],
    description: "Use the <chroot path> environment",
    args: {
      name: "chrootpath",
      description: "Path to chroot under",
      template: "folders",
    }
  },
  {
    name: ["--root", "-r"],
    description: "Install packages within the specified root directory",
    args: {
      name: "rootdir",
      description: "Directory to install within",
      template: "folders",
    },
  },
  {
    name: ["--config", "-C"],
    description: "Use the specified file for configuration",
    args: {
      name: "file",
      description: "Configuration file",
      generators: filepaths({
        extensions: ["conf"],
      }),
    },
  },
  {
    name: ["--repo-conf-dir", "-R"],
    description: "Search the directory for per-repo configuration files. Overrides REPOS_DIR in the main config file",
    args: {
      name: "confdir",
      description: "Repo configuration directory",
      template: "folders",
    },
  },
  {
    name: "-4",
    description: "Only use IPv4",
  },
  {
    name: "-6",
    description: "Only use IPv6",
  }]
};

export default completionSpec;
