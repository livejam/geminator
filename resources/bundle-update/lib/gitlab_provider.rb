require "gitlab"

class GitlabProvider
  def initialize(endpoint:, private_token:, project:, working_branch:, working_dir:)
    @project = project
    @working_branch = working_branch
    @working_dir = working_dir

    Gitlab.configure do |config|
      config.endpoint       = endpoint # API endpoint URL, default: ENV['GITLAB_API_ENDPOINT']
      config.private_token  = private_token       # user's private token or OAuth2 access token, default: ENV['GITLAB_API_PRIVATE_TOKEN']
    end
  end

  def ensure_working_branch
    Gitlab.create_branch(@project, @working_branch, "master") rescue nil
  end

  def fetch_files(*file_names)
    file_names.map do |file_name|
      fetch_file(file_name)
    end
  end

  def fetch_file(file_name)
    Gitlab.get_file(@project, file_name, @working_branch)
  end

  def commit(file, new_content, message)
    actions = [
      {
        action: "update",
        file_path: file.file_name,
        content: new_content,
        last_commit_id: file.last_commit_id
      }
    ]

    Gitlab.create_commit(@project, @working_branch, message, actions)
  end
end
