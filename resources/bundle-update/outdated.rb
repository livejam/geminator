require 'fileutils'
require 'tmpdir'
require_relative 'lib/gitlab_provider'
require_relative 'lib/github_provider'

def provider_class
  case ENV["GIT_PROVIDER"].downcase
  when 'gitlab' then GitlabProvider
  when 'github' then GithubProvider
  else
    raise "please provide a correct PROVIDER env (gitlab or github)"
  end
end

def handler(event:, context:)
  project = event['project']
  dir = Dir.mktmpdir

  git = provider_class.new(
    endpoint: '',
    private_token: ENV.fetch("PRIVATE_TOKEN"),
    project: project,
    working_branch: 'master',
    working_dir: dir
  )

  files = git.fetch_files("Gemfile", "Gemfile.lock")
  files.each do |file|
    File.write(File.join(dir, file.file_name), file.content)
  end

  @outdated = ''

  Dir.chdir(dir) {
    @outdated = %x[bundle outdated --parseable --strict]
  }

  @outdated.strip.split("\n").map do |line|
    line =~ /([^\s]+)\s\(newest\s([\d\.]+),\sinstalled\s([\d\.]+)/
    next unless $1
    {
      name: $1,
      newest: $2,
      installed: $3
    }
  end.compact
ensure
  FileUtils.remove_entry(dir) if dir
end
