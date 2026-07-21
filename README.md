# Automated Static Website Deployment using Terraform & GitHub Actions CI/CD

An end-to-end DevOps project that provisions AWS infrastructure using **Terraform** and automates static website deployment to **AWS S3** via **GitHub Actions CI/CD pipeline**.

---

## Architecture & Workflow

1. **Infrastructure as Code (IaC):** Terraform creates and manages the AWS S3 Bucket configured for static website hosting.
2. **Version Control:** Application code and workflow files are managed in a GitHub repository.
3. **CI/CD Pipeline:** Any commit pushed to the `main` branch automatically triggers GitHub Actions.
4. **Automated Deployment:** GitHub Actions syncs the updated static website files (`index.html`, `style.css`, `script.js`) directly to the AWS S3 bucket.

---

## Tech Stack & Tools

* **Cloud Provider:** AWS (S3, IAM)
* **IaC Tool:** Terraform
* **CI/CD:** GitHub Actions
* **Version Control:** Git & GitHub
* **Frontend:** HTML, CSS, JavaScript

---

## 📁 Repository Structure

```text
StudyWebsite/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions CI/CD workflow
├── index.html                  # Main website landing page
├── style.css                   # Styling file
├── script.js                   # JavaScript logic
├── main.tf                     # Terraform configuration for AWS S3
├── .gitignore                  # Git ignore rules for Terraform secrets
└── README.md                   # Project documentation
