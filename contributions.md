## 🛠 Team Workflow: Using the Dev Branch

To keep our `main` branch stable and bug-free, we use a **dev** branch for all active work. **Please do not push directly to `main`.**

### 1. Initial Setup (Do this once)

If you don't have the `dev` branch on your computer yet, run:

```bash
git fetch origin
git checkout dev

```

### 2. Daily Routine (The "Safety First" Loop)

Before you start coding every day, make sure you have the latest work from the team:

```bash
git checkout dev
git pull origin dev

```

### 3. Saving Your Work

Work as usual, but make sure you are on the `dev` branch. When you are ready to save:

```bash
git add .
git commit -m "Brief description of what you changed"
git push origin dev

```

### 4. Moving Changes to Main (Pull Requests)

When a feature is finished and tested on `dev`, we move it to `main` using the GitHub/GitLab website:

1. Go to the project page on the web.
2. Click the **"Compare & pull request"** button (usually appears in a yellow bar).
3. Set **Base: main** and **Compare: dev**.
4. Click **"Create pull request"**.
5. Once reviewed, click **"Merge pull request"**.

---

### ⚠️ Pro-Tips for the Team

* **Check your branch:** Always type `git branch` if you aren't sure where you are. The one with the `*` is your current spot.
* **Don't panic:** If Git tells you there is a "Conflict," it just means two people edited the same line. Ask a teammate to help you pick the right version!
* **Keep commits small:** It’s better to push 5 small updates than one giant "Everything" update.
