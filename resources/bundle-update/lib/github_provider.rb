require 'base64'
require "octokit"

class GithubProvider
  class GitFile
    attr_reader :file_name, :content, :content_base64, :last_commit_sha, :encoding

    def initialize(file)
      @file_name = file.name
      @last_commit_sha = file.sha
      @encoding = file.encoding
      @content_base64 = file.content
      @content = Base64.decode64(file.content)
    end
  end

  def initialize(endpoint:, private_token:, project:, working_branch:, working_dir:)
    @project = project
    @working_branch = working_branch
    @working_dir = working_dir

    @client = Octokit::Client.new(:access_token => private_token)
  end

  def ensure_working_branch
    master_ref = Octokit.ref(@project, "heads/master")
    @client.create_ref(@project, "heads/#{@working_branch}", master_ref.object.sha)
  rescue Octokit::UnprocessableEntity => e
    nil
  end

  def fetch_files(*file_names)
    file_names.map do |file_name|
      fetch_file(file_name)
    end
  end

  def fetch_file(file_name)
    GitFile.new(@client.contents(@project, :path => file_name, :ref => @working_branch))
  end

  def commit(file, new_content, message)
    @client.update_contents(
      @project,
      file.file_name,
      message,
      file.last_commit_sha,
      new_content,
      :branch => @working_branch
    )
  end
end
