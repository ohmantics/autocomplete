import { filepaths } from "@fig/autocomplete-generators";

export const zpoolGenerator: Fig.Generator = {
  script: "zpool list -H -o name",
  postProcess: function (out) {
  return out
    .split("\n")
    .map((pool) => ({
      name: pool,
      icon: "fig://icon?type=database",
      description: "Available zpools",
    }));
  },
};

const readonlyZpoolProperties: Fig.Suggestion[] = [
  {
    name: "allocated",
    description: "Amount of storage used within the pool",
  },
  {
    name: "capacity",
    description: "Percentage of pool space used",
  },
  {
    name: "expandsize",
    description: "Amount of uninitialized space within the pool or device",
  },
  {
    name: "fragmentation",
    description: "Amount of fragmentation in the pool",
  },
  {
    name: "free",
    description: "Amount of free space available in the pool",
  },
  {
    name: "freeing",
    description: "Space remaining to be reclaimed",
  },
  {
    name: "leaked",
    description: "Space not released while freeing due to corruption",
  },
  {
    name: "health",
    description: "Current health of the pool",
  },
  {
    name: "guid",
    description: "Unique identifier for the pool",
  },
  {
    name: "load_guid",
    description: "Unique identifier for the pool (non-persistent)",
  },
  {
    name: "size",
    description: "Total size of the storage pool",
  },
  {
    name: "unsupported@feature_guid",
    description: "Information about unsupported features that are enabled on the pool",
    // TODO: expand features
  },
];

// TODO: these Suggestions need Args accordingly
const creationZpoolProperties: Fig.Option[] = [
  {
    name: "altroot",
    description: "Alternate root directory",
  },
  {
    name: "readonly",
    description: "Import pool in read-only mode",
    requiresSeparator: true,
    args: { suggestions: ["on", "off"], },
  },
  {
    name: "ashift",
    description: "Pool sector size exponent, to the power of 2",
    requiresSeparator: true,
    args: {
      name: "ashift",
      description: "Power of 2 for sector size",
      suggestions: ["9", "12"],
    },
  },
  {
    name: "autoexpand",
    description: "Controls automatic pool expansion when the underlying LUN is grown",
    requiresSeparator: true,
    args: { suggestions: ["on", "off"], },
  },
  {
    name: "autoreplace",
    description: "Controls automatic device replacement",
    requiresSeparator: true,
    args: { suggestions: ["on", "off"], },
  },
  {
    name: "autotrim",
    description: "Periodic trimming",
    requiresSeparator: true,
    args: { suggestions: ["on", "off"], },
  },
  {
    name: "bootfs=(unset)|pool/dataset",
    description: "Identifies the default bootable dataset for the root pool",
    // TODO: pool/dataset
  },
  {
    name: "cachefile",
    description: "Controls the location of where the pool configuration is cached",
    requiresSeparator: true,
    args: {
      suggestions: [{
        name: "none",
        description: "Do not cache pool configuration",
      },
      {
        name: "\"\"",
        description: "Use default location",
      },
      // TODO: path
      ]
    }
  },
  {
    name: "comment",
    description: "A text string consisting of printable ASCII characters that will be stored",
    requiresSeparator: true,
    args: {
      name: "comment",
      description: "Text to store as comment",
    },
  },
  {
    name: "compatibility",
    description: "Specifies that the pool maintain compatibility with specific feature sets",
    requiresSeparator: true,
    args: {
      suggestions: [{
        name: "off",
        description: "Disable compatibility (enable all features)",
      },
      {
        name: "legacy",
        description: "Disable all features",
      },
      // TODO: file,[file...]
      ]
    },
  },
  {
    name: "dedupditto",
    description: "This property is deprecated and no longer has any effect",
    hidden: true,
    deprecated: true,
    requiresSeparator: true,
    args: {
      name: "number",
      description: "Threshold for number of copies",
    },
  },
  {
    name: "delegation",
    description: "Controls whether a non-privileged user is granted access based on the dataset",
    requiresSeparator: true,
    args: { suggestions: ["on", "off"], },
  },
  {
    name: "failmode",
    description: "Controls the system behavior in the event of catastrophic pool failure",
    requiresSeparator: true,
    args: {
      suggestions: [{
        name: "wait",
        description: "Blocks all I/O access until the device connectivity is recovered and the errors",
      },
      {
        name: "continue",
        description: "Returns EIO for write, but allows read",
      },
      {
        name: "panic",
        description: "Prints out a message to the console and generates a system crash dump",
      }],
    },
  },
  {
    name: "feature@feature_name=enabled",
    description: "The value of this property is the current state of feature_name",
    // TODO: feature names
  },
  {
    name: "listsnapshots",
    description: "List snapshots without the -t option",
    requiresSeparator: true,
    args: { suggestions: ["on", "off"], },
  },
  {
    name: "multihost",
    description: "Controls whether a pool activity check should be performed during",
    requiresSeparator: true,
    args: { suggestions: ["on", "off"], },
  },
  {
    name: "version",
    description: "The current on-disk version of the pool",
    requiresSeparator: true,
    requiresEquals: true,
    args: {
      name: "version",
      description: "Version number",
    },
  },
];

const allZpoolProperties: Fig.Suggestion[] = [
  ...readonlyZpoolProperties,
  //...creationZpoolProperties,
];

const timestampOption: Fig.Option =  {
  name: "-T",
  description: "Display a time stamp",
  args: {
    suggestions: [{
      name: "u",
      description: "Internal representation of time",
    },
    {
      name: "d",
      description: "Standard date format"
    }],
  },
};

function zpoolArg(desc: string) {
  return {
    name: "pool",
    description: desc,
    generators: zpoolGenerator,
  };
}

function zpoolOptionalArg(desc: string) {
  var a: Fig.Arg = zpoolArg(desc);
  a.isOptional = true;
  return a;
}

const completionSpec: Fig.Spec = {
  name: "zpool",
  description: "Configure ZFS storage pools",
  requiresSubcommand: true,
  parserDirectives: { optionsMustPrecedeArguments: true, },
  options: [{
    name: ["--version", "-V"],
    description: "An alias for the zpool version command",
  },
  {
    name: "-?",
    description: "Displays a help message",
  }],
  subcommands: [
  {
    name: "add",
    description: "",
  },
  {
    name: "attach",
    description: "",
  },
  {
    name: "checkpoint",
    description: "Checkpoints the current state of a ZFS storage pool",
    options: [{
      name: ["--discard", "-d"],
      description: "Discards an existing checkpoint from pool",
    },
    {
      name: ["--wait", "-w"],
      description: "Waits until the checkpoint has finished being discarded",
      dependsOn: ["--discard"],
    }],
    args: zpoolArg("Pool to checkpoint"), // TODO: dedup pools using valueList
  }, // checkpoint
  {
    name: "clear",
    description: "",
  },
  {
    name: "create",
    description: "",
  },
  {
    name: "destroy",
    description: "Destroys the given ZFS storage pool, freeing up any devices for other use",
    options: [{
      name: "-f",
      description: "Forces any active datasets contained within the pool to be unmounted",
    }],
    args: zpoolArg("Pool to destroy"),
    isDangerous: true,
  }, // destroy
  {
    name: "detach",
    description: "",
  },
  {
    name: "events",
    description: "Lists all recent events generated by the ZFS kernel modules",
    options: [{
      name: "-c",
      description: "Clear all previous events",
      exclusiveOn: ["-f", "-H", "-v "],
    },
    {
      name: "-f",
      description: "Follow mode",
      exclusiveOn: ["-c"],
    },
    {
      name: "-H",
      description: "Do not display headers, and separate fields by a single tab instead of arbitrary space",
      exclusiveOn: ["-c"],
    },
    {
      name: "-v",
      description: "Print the entire payload for each event",
      exclusiveOn: ["-c"],
    }],
    args: zpoolOptionalArg("Pool to list events"),
    // TODO: pool arg should only be optional exclusiveOn -c
  }, // events
  {
    name: "export",
    description: "Exports the given ZFS storage pools from the system",
    options: [{
      name: "-a",
      description: "Exports all pools",
    },
    {
      name: "-f",
      description: "Forcefully unmount all datasets, using the unmount -f command",
      // TODO: -f unsupported on Linux
    }],
    args: { ...zpoolArg("Pool to export"), isVariadic: true, },
    // TODO: pool arg not needed if -a used
  }, // export
  {
    name: "get",
    description: "Retrieves properties for the specified ZFS storage pool",
    // gettable properties zpool get 2>&1 | awk '$2 == "YES" || $2 == "NO" {print $1}'; echo all
  },
  {
    name: "history",
    description: "Displays the command history of the specified ZFS storage pool(s)",
    options: [{
      name: "-i",
      description: "Displays internally logged ZFS events in addition to user initiated events",
    },
    {
      name: "-l",
      description: "Displays log records in long format",
    }],
    args: {
      name: "pool",
      description: "Pool to show history",
      isOptional: true,
      generators: zpoolGenerator,
    },
  }, // history
  {
    name: "import",
    description: "",
  },
  {
    name: "initialize",
    description: "",
  },
  {
    name: "iostat",
    description: "",
  },
  {
    name: "labelclear",
    description: "",
  },
  {
    name: "list",
    description: "Lists ZFS storage pools along with a health status and space usage",
    options: [{
      name: "-g",
      description: "Display vdev GUIDs instead of the normal device names",
    },
    {
      name: "-H",
      description: "Do not display headers, and separate fields by a single tab instead of arbitrary space",
    },
    {
      name: "-L",
      description: "Display real paths for vdevs resolving all symbolic links",
    },
    {
      name: "-p",
      description: "Display numbers in parsable (exact) values",
    },
    {
      name: "-P",
      description: "Display full paths for vdevs instead of only the last component of the path",
    },
    timestampOption,
    {
      name: "-v",
      description: "Verbose statistics",
    },
    {
      name: "-o",
      description: "Comma-separated list of properties to display",
      args: {
        name: "property",
        description: "Properties to display",
        generators: {
          getQueryTerm: ",",
          custom: async () => {
            return allZpoolProperties.map((prop) => {
              // strip any value-setting
              const suggestion: Fig.Suggestion = {
                name: prop.name,
                description: prop.description
              };
              return suggestion;
            });
          },
          // TODO: retest when the property keys can expand their values
        },
      },
    }]
  }, // list
  {
    name: "offline",
    description: "",
  },
  {
    name: "online",
    description: "",
  },
  {
    name: "reguid",
    description: "Generate a new unique identifier for a ZFS storage pool",
    args: zpoolArg("Pool to reguid"),
  }, // reguid
  {
    name: "remove",
    description: "",
  },
  {
    name: "reopen",
    description: "Reopen all virtual devices (vdevs) associated with a ZFS storage pool",
    options: [{
      name: "-n",
      description: "Do not restart an in-progress scrub operation",
      isDangerous: true,
    }],
    args: zpoolArg("Pool to reopen"),
  }, // reopen
  {
    name: "replace",
    description: "",
  },
  {
    name: "resilver",
    description: "Start a resilver of a device in a ZFS storage pool",
    args: zpoolArg("Pool to resilver"),
  }, // resilver
  {
    name: "scrub",
    description: "Begin a scrub or resume a paused scrub of a ZFS storage pool",
    options: [{
      name: "-s",
      description: "Stop scrubbing",
    },
    {
      name: "-p",
      description: "Pause scrubbing",
    },
    {
      name: "-w",
      description: "Wait until scrub has completed",
    }],
    args: zpoolArg("Pool to scrub"),
  }, // scrub
  {
    name: "set",
    description: "Sets the given property on the specified ZFS storage pool",
    args: [
      {
        //requiresEquals: true,
        //requiresSeparator: true,
        suggestions: allZpoolProperties,
      },
      zpoolArg("Pool to set properties on"),
    ],
    // TODO: append other properties that are available at runtime, but unknown to this code using
    // zpool get 2>&1 | awk '$2 == "YES" {print $1"="}'
  }, // set
  {
    name: "split",
    description: "",
  },
  {
    name: "status",
    description: "",
  },
  {
    name: "sync",
    description: "Force data to be written to primary storage of a ZFS storage pool and update reporting data",
    args: zpoolOptionalArg("Pool to sync"),
  }, // sync
  {
    name: "trim",
    description: "",
  },
  {
    name: "upgrade",
    description: "Manage version and feature flags of ZFS storage pools",
    options: [{
      name: "-v",
      description: "Displays legacy ZFS versions supported by the current software",
    },
    {
      name: "-V",
      description: "Upgrade to the specified legacy version",
      exclusiveOn: ["-v"],
      args: {
        name: "version",
        description: "Legacy version to increase to",
      },
    }],
    args: {
      name: "pool",
      description: "Zpool to upgrade",
      isVariadic: true,
      generators: zpoolGenerator,
      suggestions: [{
        name: "-a",
        description: "Enables all supported features (from specified compatibility sets, if any) on all pools",
      }],
    },
    // TODO: pool argument should only be present if -v is not provided
  }, // upgrade
  {
    name: "version",
    description: "Displays the software version of the zpool userland utility and the zfs kernel module",
  }, // version
  {
    name: "wait",
    description: "Wait for background activity to stop in a ZFS storage pool",
    options: [{
      name: "-H",
      description: "Do not display headers, and separate fields by a single tab instead of arbitrary space",
    },
    {
      name: "-p",
      description: "Display numbers in parsable (exact) values",
    },
    timestampOption,
    {
      name: "-t",
      description: "Types of activity to wait for",
      args: {
        name: "activity",
        description: "Type of activity to wait for",
        suggestions: [{
          name: "discard",
          description: "Checkpoint to be discarded",
        },
        {
          name: "free",
          description: "'freeing' property to become 0",
        },
        {
          name: "initialize",
          description: "All initializations to cease",
        },
        {
          name: "replace",
          description: "All device replacements to cease",
        },
        {
          name: "remove",
          description: "Device removal to cease",
        },
        {
          name: "resilver",
          description: "Resilver to cease",
        },
        {
          name: "scrub",
          description: "Scrub to cease",
        },
        {
          name: "trim",
          description: "Manual trim to cease",
        }],
      },
    }],
    args: [zpoolArg("Pool to wait for"),
    {
      name: "interval",
      description: "Seconds of internal between status displays",
      isOptional: true,
    }],
  }, // wait
  ],
};

export default completionSpec;
