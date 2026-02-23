# PHP → Next.js API Routes & cURL Examples

Base URL (development): **http://localhost:3000**  
Replace with your domain in production (e.g. `https://yourdomain.com`).

---

## 1. village_members_crud.php → `/api/village-members-crud`

| Method | Description |
|--------|-------------|
| GET | List all active village members |
| POST | action=1: list by village_id; action=2: insert; action=3: update |
| DELETE | Delete member by id |

**cURL examples:**

```bash
# GET - All active members
curl -X GET "http://localhost:3000/api/village-members-crud"

# POST - List by village_id (action=1)
curl -X POST "http://localhost:3000/api/village-members-crud" \
  -F "action=1" \
  -F "village_id=1"

# POST - Insert new member (action=2)
curl -X POST "http://localhost:3000/api/village-members-crud" \
  -F "action=2" \
  -F "village_id=1" \
  -F "name=Member Name" \
  -F "Position=सचिव" \
  -F "contact_number=9876543210" \
  -F "user_id=1" \
  -F "photo=@/path/to/photo.jpg"

# POST - Update member (action=3)
curl -X POST "http://localhost:3000/api/village-members-crud" \
  -F "action=3" \
  -F "id=5" \
  -F "village_id=1" \
  -F "name=Updated Name" \
  -F "Position=अध्यक्ष" \
  -F "contact_number=9876543210" \
  -F "user_id=1" \
  -F "photo=@/path/to/newphoto.jpg"

# DELETE - Delete member
curl -X DELETE "http://localhost:3000/api/village-members-crud?id=5"
```

---

## 2. update_user_email.php → `/api/update-user-email`

| Method | Description |
|--------|-------------|
| POST | Update user email by user_id |

**cURL example:**

```bash
curl -X POST "http://localhost:3000/api/update-user-email" \
  -F "user_id=1" \
  -F "email=newemail@example.com"
```

---

## 3. fetch_forwarded_to.php → `/api/fetch-forwarded-to`

| Method | Description |
|--------|-------------|
| POST | Get proposals forwarded to a category (forward_to) |

**cURL example:**

```bash
curl -X POST "http://localhost:3000/api/fetch-forwarded-to" \
  -F "forward_to=24"
```

---

## 4. fetch_proposal_by_user_category.php → `/api/fetch-proposal-by-user-category`

| Method | Description |
|--------|-------------|
| POST | Get proposals filtered by forward_to (user category) |

**cURL example:**

```bash
curl -X POST "http://localhost:3000/api/fetch-proposal-by-user-category" \
  -F "forward_to=24"
```

---

## 5. proposal_crud.php → `/api/proposal-crud`

| Method | Description |
|--------|-------------|
| GET | List all active proposals with joins |
| POST | action=1: create proposal (+ files); action=2: update proposal |
| DELETE | Delete proposal by proposal_id |

**cURL examples:**

```bash
# GET - All proposals
curl -X GET "http://localhost:3000/api/proposal-crud"

# POST - Create proposal (action=1)
curl -X POST "http://localhost:3000/api/proposal-crud" \
  -F "action=1" \
  -F "proposal_category_id=1" \
  -F "proposal_document_id=1" \
  -F "remarks=Test" \
  -F "land_details=..." \
  -F "number_of_tree=10" \
  -F "beneficiaries=5" \
  -F "taluka_id=1" \
  -F "gp_id=1" \
  -F "village_id=1" \
  -F "from_cate_id=24" \
  -F "forward_to=24" \
  -F "work_status=1" \
  -F "user_id=1" \
  -F "pdf=@/path/to/file.pdf" \
  -F "pdf2=@/path/to/supporting.pdf" \
  -F "docFiles=@/path/to/doc1.pdf" \
  -F "docFiles=@/path/to/doc2.pdf"

# POST - Update proposal (action=2)
curl -X POST "http://localhost:3000/api/proposal-crud" \
  -F "action=2" \
  -F "proposal_id=10" \
  -F "proposal_category_id=1" \
  -F "proposal_document_id=1" \
  -F "remarks=Updated" \
  -F "land_details=..." \
  -F "number_of_tree=10" \
  -F "beneficiaries=5" \
  -F "taluka_id=1" \
  -F "gp_id=1" \
  -F "village_id=1" \
  -F "from_cate_id=24" \
  -F "forward_to=24" \
  -F "work_status=1" \
  -F "user_id=1" \
  -F "is_rejected=No" \
  -F "pdf=@/path/to/file.pdf"

# DELETE - Delete proposal
curl -X DELETE "http://localhost:3000/api/proposal-crud" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "proposal_id=10"
```

---

## 6. fetch_all_proposal_document.php → `/api/fetch-all-proposal-document`

| Method | Description |
|--------|-------------|
| GET | List all active proposal documents |

**cURL example:**

```bash
curl -X GET "http://localhost:3000/api/fetch-all-proposal-document"
```

---

## 7. fetch_all_ifr_questions.php → `/api/fetch-all-ifr-questions`

| Method | Description |
|--------|-------------|
| GET | List all active IFR questions |

**cURL example:**

```bash
curl -X GET "http://localhost:3000/api/fetch-all-ifr-questions"
```

---

## 8. update_proposal_work_status.php → `/api/update-proposal-work-status`

| Method | Description |
|--------|-------------|
| POST | Update proposal work status / forward / reject |

**cURL example:**

```bash
curl -X POST "http://localhost:3000/api/update-proposal-work-status" \
  -F "proposal_id=10" \
  -F "work_status=2" \
  -F "reject_reason=" \
  -F "from_cate_id=24" \
  -F "forward_to=25" \
  -F "user_id=1"
```

---

## 9. fetch_all_proposal_category.php → `/api/fetch-all-proposal-category`

| Method | Description |
|--------|-------------|
| GET | List all active proposal categories |

**cURL example:**

```bash
curl -X GET "http://localhost:3000/api/fetch-all-proposal-category"
```

---

## 10. fetch_all_designation.php → `/api/fetch-all-designation`

| Method | Description |
|--------|-------------|
| GET | Get designation list (अध्यक्ष, सचिव, खजिनदार, सदस्य) |

**cURL example:**

```bash
curl -X GET "http://localhost:3000/api/fetch-all-designation"
```

---

## Quick reference – All API links (GET)

| PHP File | API Route |
|----------|-----------|
| village_members_crud.php | http://localhost:3000/api/village-members-crud |
| update_user_email.php | http://localhost:3000/api/update-user-email |
| fetch_forwarded_to.php | http://localhost:3000/api/fetch-forwarded-to |
| fetch_proposal_by_user_category.php | http://localhost:3000/api/fetch-proposal-by-user-category |
| proposal_crud.php | http://localhost:3000/api/proposal-crud |
| fetch_all_proposal_document.php | http://localhost:3000/api/fetch-all-proposal-document |
| fetch_all_ifr_questions.php | http://localhost:3000/api/fetch-all-ifr-questions |
| update_proposal_work_status.php | http://localhost:3000/api/update-proposal-work-status |
| fetch_all_proposal_category.php | http://localhost:3000/api/fetch-all-proposal-category |
| fetch_all_designation.php | http://localhost:3000/api/fetch-all-designation |

---

**Note:**  
- Dev server: `npm run dev` → base URL `http://localhost:3000`  
- Production: replace `http://localhost:3000` with your deployed URL.
