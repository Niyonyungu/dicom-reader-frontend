# andasy.hcl app configuration file generated for dicomviewerfe on Friday, 27-Mar-26 16:38:15 EET
#
# See https://github.com/quarksgroup/andasy-cli for information about how to use this file.

app_name = "dicomviewerfe"

app {

  env = {}

  port = 3000

  primary_region = "kgl"

  compute {
    cpu      = 1
    memory   = 256
    cpu_kind = "shared"
  }

  process {
    name = "dicomviewerfe"
  }

}
