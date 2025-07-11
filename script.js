import { NextResponse } from "next/server"

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams
  const username = searchParams.get("username")

  if (!username) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 })
  }

  try {
    // Fetch user data
    const userResponse = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "GitHub-Profile-Analyzer",
      },
    })

    if (!userResponse.ok) {
      if (userResponse.status === 404) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }
      throw new Error(`GitHub API error: ${userResponse.status}`)
    }

    const user = await userResponse.json()

    // Fetch repositories
    const reposResponse = await fetch(
      `https://api.github.com/users/${username}/repos?sort=stars&direction=desc&per_page=100`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "GitHub-Profile-Analyzer",
        },
      },
    )

    if (!reposResponse.ok) {
      throw new Error(`GitHub API error: ${reposResponse.status}`)
    }

    const repositories = await reposResponse.json()

    // Calculate statistics
    const languages = {}
    let totalStars = 0
    let totalForks = 0

    repositories.forEach((repo) => {
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1
      }
      totalStars += repo.stargazers_count || 0
      totalForks += repo.forks_count || 0
    })

    const data = {
      user,
      repositories: repositories.slice(0, 20), // Limit to top 20 repos
      languages,
      totalStars,
      totalForks,
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching GitHub data:", error)
    return NextResponse.json({ error: "Failed to fetch GitHub data" }, { status: 500 })
  }
}
