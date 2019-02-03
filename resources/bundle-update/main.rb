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
  gem_name = event['gem_name']
  project = event['project']
  dir = Dir.mktmpdir

  git = provider_class.new(
    endpoint: '',
    private_token: ENV.fetch("PRIVATE_TOKEN"),
    project: project,
    working_branch: ENV.fetch("WORKING_BRANCH", "geminator"),
    working_dir: dir
  )

  git.ensure_working_branch
  files = git.fetch_files("Gemfile", "Gemfile.lock")
  files.each do |file|
    File.write(File.join(dir, file.file_name), file.content)
  end

  Dir.chdir(dir) {
    puts %x[bundle lock --update #{gem_name} --conservative]
  }

  gemfile_lock = files.detect { |f| f.file_name == "Gemfile.lock" }

  content = IO.read(File.join(dir, gemfile_lock.file_name))
  if gemfile_lock.content != content
    git.commit(gemfile_lock, content, "Upgrade #{gem_name} conservatively")
    puts "upgraded gem"
    git.ensure_pull_request
    puts "created pull request"
  else
    puts "nothing changed"
  end
ensure
  FileUtils.remove_entry(dir) if dir
end
