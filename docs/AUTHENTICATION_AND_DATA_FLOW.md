# IOC Threat Intelligence Platform - Complete Authentication & Data Flow Documentation

**Version:** 1.0  
**Last Updated:** January 1, 2026  
**Author:** Security Engineering Team  

---

## Table of Contents

1. [High-Level System Architecture](#1-high-level-system-architecture)
2. [User Authentication Flow](#2-user-authentication-flow)
3. [Token & Session Management](#3-token--session-management)
4. [Route Protection & Access Control](#4-route-protection--access-control)
5. [User-Based Data Storage](#5-user-based-data-storage)
6. [Fetching Data for Specific Users](#6-fetching-data-for-specific-users)
7. [IOC Scan Flow (Authenticated User)](#7-ioc-scan-flow-authenticated-user)
8. [Security Best Practices](#8-security-best-practices-implemented)
9. [Common Auth Failure Scenarios](#9-common-auth-failure-scenarios)
10. [Summary Flow (Plain English)](#10-summary-flow-plain-english)
11. [Optional Enhancements](#11-optional-enhancements)

---

## 1. High-Level System Architecture

### Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                          │
│  - Next.js 14 App Router (React 18)                         │
│  - AuthContext (Global State Management)                     │
│  - localStorage (Token & User Storage)                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTPS/HTTP
                     │ Authorization: Bearer <JWT>
                     │
┌────────────────────▼────────────────────────────────────────┐
│              NEXT.JS SERVER (App Router)                     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Middleware Layer (middleware.ts)                     │  │
│  │  - Route-level protection                             │  │
│  │  - Admin route validation                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Routes (app/api/*)                               │  │
│  │  - /api/auth/login    → Authentication                │  │
│  │  - /api/auth/logout   → Session termination           │  │
│  │  - /api/ioc           → IOC analysis & storage        │  │
│  │  - /api/dashboard     → User dashboard data           │  │
│  │  - /api/history       → User's IOC history            │  │
│  │  - /api/admin/*       → Admin-only operations         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Auth Utilities (lib/auth.ts)                         │  │
│  │  - Token generation (JWT)                             │  │
│  │  - Token verification                                 │  │
│  │  - Role-based access control                          │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Mongoose ODM
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    MongoDB Database                          │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐                    │
│  │  Users         │  │  IOCs          │                    │
│  │  Collection    │  │  Collection    │                    │
│  │                │  │                │                    │
│  │  - _id         │  │  - _id         │                    │
│  │  - username    │  │  - userId ──────────► References    │
│  │  - password    │  │  - username    │      User._id      │
│  │  - role        │  │  - ioc         │                    │
│  │  - lastLogin   │  │  - type        │                    │
│  │  - timestamps  │  │  - vt          │                    │
│  └────────────────┘  │  - threat_intel│                    │
│                      │  - isPublic    │                    │
│                      │  - timestamps  │                    │
│                      └────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
                     │
                     │ REST API (HTTPS)
                     │
┌────────────────────▼────────────────────────────────────────┐
│              External Threat Intelligence APIs               │
│                                                              │
│  - VirusTotal API      (Malware & File Analysis)            │
│  - AbuseIPDB API       (IP Reputation Checks)               │
└─────────────────────────────────────────────────────────────┘
```

### Authentication Strategy

- **Method:** JWT (JSON Web Tokens)
- **Storage:** Client-side localStorage
- **Transport:** HTTP Authorization header (`Bearer <token>`)
- **Expiration:** 7 days (configurable)
- **Password Hashing:** bcrypt with salt rounds = 12

---

## 2. User Authentication Flow

### 2.1 User Registration

**Current Status:** ⚠️ **Registration is DISABLED** in production.

Users must be created by administrators using backend scripts or admin panel.

#### User Schema (MongoDB/Mongoose)

```typescript
// src/lib/models/User.ts

export interface IUser extends Document {
  username: string;       // Unique identifier (3-30 chars)
  password: string;       // Bcrypt hashed (min 6 chars)
  role: 'user' | 'admin'; // Role-based access
  lastLogin?: Date;       // Last successful login
  createdAt: Date;        // Auto-generated
  updatedAt: Date;        // Auto-generated
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,        // ✅ Prevents duplicate usernames
      trim: true,
      minlength: 3,
      maxlength: 30,
      index: true          // ✅ Optimizes login queries
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false        // ✅ SECURITY: Don't return password by default
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      index: true
    },
    lastLogin: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }     // ✅ Auto-creates createdAt & updatedAt
);
```

#### Password Hashing (Pre-save Hook)

```typescript
// Automatically hash password before saving to database
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);  // ✅ 12 rounds (secure)
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});
```

**Security Features:**
- ✅ Passwords are **NEVER** stored in plaintext
- ✅ Bcrypt automatically generates unique salts per user
- ✅ 12 salt rounds = computationally expensive for attackers
- ✅ `select: false` prevents accidental password leakage in queries

---

### 2.2 User Login

#### Login Flow Diagram

```
┌─────────────┐                ┌─────────────┐                ┌─────────────┐
│   Browser   │                │  Next.js    │                │  MongoDB    │
│  (Client)   │                │  Backend    │                │  Database   │
└──────┬──────┘                └──────┬──────┘                └──────┬──────┘
       │                              │                              │
       │ 1. POST /api/auth/login      │                              │
       │ { username, password }       │                              │
       ├─────────────────────────────►│                              │
       │                              │                              │
       │                              │ 2. Find user by username     │
       │                              ├─────────────────────────────►│
       │                              │    .select('+password')      │
       │                              │                              │
       │                              │ 3. User document returned    │
       │                              │◄─────────────────────────────┤
       │                              │                              │
       │                              │ 4. Compare passwords         │
       │                              │    bcrypt.compare()          │
       │                              │                              │
       │                              │ 5. Generate JWT              │
       │                              │    (userId, username, role)  │
       │                              │                              │
       │                              │ 6. Update lastLogin          │
       │                              ├─────────────────────────────►│
       │                              │                              │
       │ 7. Return token & user data  │                              │
       │◄─────────────────────────────┤                              │
       │                              │                              │
       │ 8. Store in localStorage     │                              │
       │    - auth_token              │                              │
       │    - auth_user               │                              │
       │                              │                              │
```

#### Backend Implementation (`/api/auth/login`)

```typescript
// src/app/api/auth/login/route.ts

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { username, password } = await req.json();

    // ✅ Input validation
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // ✅ Normalize username (prevent case-sensitivity issues)
    const normalizedUsername = username.trim();

    // ✅ Find user (MUST include password for comparison)
    const user = await User.findOne({ 
      username: normalizedUsername 
    }).select('+password');

    if (!user) {
      // ✅ SECURITY: Generic error (don't reveal which field failed)
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // ✅ Compare password using bcrypt
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // ✅ SECURITY: Same generic error
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // ✅ Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    // ✅ Generate JWT token
    const token = generateToken(
      user._id.toString(),
      user.username,
      user.role
    );

    // ✅ Return success response
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
```

#### Frontend Implementation (AuthContext)

```typescript
// src/contexts/AuthContext.tsx

const login = async (username: string, password: string) => {
  try {
    setIsLoading(true);
    
    // ✅ Send credentials to backend
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Login failed');
    }

    const data = await response.json();
    const { token: newToken, user: newUser } = data;

    // ✅ Store token and user data
    setToken(newToken);
    setUser({
      id: newUser.id,
      username: newUser.username,
      role: newUser.role
    });
    
    // ✅ Persist to localStorage for page refreshes
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
  } finally {
    setIsLoading(false);
  }
};
```

**Why This Method Is Secure:**

1. ✅ **Password never transmitted in URL** (POST body only)
2. ✅ **Generic error messages** prevent username enumeration
3. ✅ **Bcrypt comparison** is timing-attack resistant
4. ✅ **Token-based auth** prevents session fixation attacks
5. ✅ **No cookies** = immune to CSRF attacks

---

## 3. Token & Session Management

### JWT Structure

```javascript
// HEADER
{
  "alg": "HS256",           // Algorithm: HMAC SHA-256
  "typ": "JWT"              // Type: JSON Web Token
}

// PAYLOAD
{
  "userId": "507f1f77bcf86cd799439011",   // MongoDB ObjectId
  "username": "john_doe",                 // Username
  "role": "user",                         // Role: 'user' | 'admin'
  "iat": 1704067200,                      // Issued At (Unix timestamp)
  "exp": 1704672000                       // Expiration (7 days later)
}

// SIGNATURE
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  JWT_SECRET
)
```

### Token Generation

```typescript
// src/lib/auth.ts

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_EXPIRY = '7d';  // 7 days

export function generateToken(
  userId: string,
  username: string,
  role: 'user' | 'admin' = 'user'
): string {
  return jwt.sign(
    { userId, username, role },  // Payload
    JWT_SECRET,                  // Secret key
    { expiresIn: JWT_EXPIRY }    // Expiration
  );
}
```

### Token Verification

```typescript
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;  // Returns payload if valid
  } catch (error) {
    // Token is invalid, expired, or tampered
    return null;
  }
}
```

### Token Extraction from Requests

```typescript
export function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  
  // Expected format: "Bearer <token>"
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}
```

### Logout Flow

```typescript
// Client-side logout (src/contexts/AuthContext.tsx)

const logout = async () => {
  try {
    setIsLoading(true);
    
    // ✅ Optional: Notify backend (for audit logs)
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
  } finally {
    // ✅ Clear client-side state
    setToken(null);
    setUser(null);
    
    // ✅ Remove from localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    
    setIsLoading(false);
  }
};
```

**Token Expiration Strategy:**

- ✅ **7-day expiry** balances security and user convenience
- ✅ **Automatic expiration** handled by JWT library
- ✅ **No server-side session storage** (stateless architecture)
- ✅ **Manual invalidation** via logout clears client storage

---

## 4. Route Protection & Access Control

### 4.1 Frontend Protection

#### Middleware (Edge-Level Protection)

```typescript
// middleware.ts (ROOT DIRECTORY)

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ✅ Protect /admin/* routes
  if (pathname.startsWith('/admin')) {
    const token = getTokenFromRequest(request);
    
    // ✅ Check token existence
    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', '/admin');
      return NextResponse.redirect(url);
    }

    // ✅ Verify token validity
    const payload = verifyToken(token);
    
    // ✅ Check admin role
    if (!payload || payload.role !== 'admin') {
      const url = new URL('/', request.url);
      url.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']  // Apply to all admin routes
};
```

#### Component-Level Protection

```typescript
// src/components/ProtectedPage.tsx

export function ProtectedPage({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // ✅ Redirect to login if not authenticated
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return null;  // Prevent flash of protected content
  }

  return <>{children}</>;
}
```

---

### 4.2 Backend Protection

#### API Route Authentication Pattern

```typescript
// Example: /api/ioc/route.ts

export async function POST(request: NextRequest) {
  try {
    // ✅ STEP 1: Extract token from Authorization header
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ✅ STEP 2: Verify token validity
    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // ✅ STEP 3: Extract userId from payload
    const userId = payload.userId;
    
    // ✅ STEP 4: Use userId for data operations
    const iocData = await IOC.find({ userId });
    
    return NextResponse.json({
      success: true,
      data: iocData
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### Admin-Only Route Protection

```typescript
// Example: /api/admin/users/route.ts

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return unauthorizedResponse();
    }

    const payload = verifyToken(token);
    if (!payload) {
      return unauthorizedResponse();
    }

    // ✅ Check admin role
    if (payload.role !== 'admin') {
      return forbiddenResponse('Admin access required');
    }

    // ✅ Proceed with admin operation
    const users = await User.find({}).select('-password');
    
    return NextResponse.json({
      success: true,
      users
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**What Happens on Failure:**

| Scenario | HTTP Status | Response | Frontend Action |
|----------|------------|----------|----------------|
| No token | 401 | `{ error: 'Unauthorized' }` | Redirect to login |
| Invalid token | 401 | `{ error: 'Invalid or expired token' }` | Clear storage, redirect to login |
| Token expired | 401 | `{ error: 'Invalid or expired token' }` | Clear storage, redirect to login |
| User is not admin | 403 | `{ error: 'Forbidden - Admin access required' }` | Show error message |

---

## 5. User-Based Data Storage

### Schema Relationships

```typescript
// src/lib/models/IOC.ts

export interface IIOC extends Document {
  userId?: string;         // ✅ Foreign key reference to User._id
  username?: string;       // ✅ Denormalized for performance
  ioc: string;             // The indicator (IP, domain, URL, hash)
  type: IOCType;           // 'ip' | 'domain' | 'url' | 'hash'
  label?: string;          // Custom user label
  isPublic?: boolean;      // Sharing flag
  
  // VirusTotal analysis results
  vt?: {
    normalized: {
      verdict: 'malicious' | 'suspicious' | 'harmless' | 'undetected' | 'unknown';
      stats: {
        malicious: number;
        suspicious: number;
        harmless: number;
        undetected: number;
      };
      reputation?: number;
      categories?: string[];
      tags?: string[];
      // ... more fields
    };
    // ... raw VT data
  };
  
  // Threat intelligence data
  threat_intel?: {
    threatTypes: string[];
    severity: 'critical' | 'high' | 'medium' | 'low' | 'unknown';
    confidence: number;
    // ... more fields
  };
  
  fetchedAt: Date;        // When analysis was performed
  updatedAt: Date;        // Last update timestamp
}

const IOCSchema = new Schema<IIOC>({
  userId: { 
    type: String,
    index: true           // ✅ CRITICAL for query performance
  },
  username: { 
    type: String,
    index: true
  },
  ioc: { 
    type: String, 
    required: true,
    index: true           // ✅ For duplicate detection
  },
  type: {
    type: String,
    enum: ['ip', 'domain', 'url', 'hash'],
    required: true,
    index: true
  },
  // ... rest of schema
}, {
  timestamps: true        // ✅ Auto-manages createdAt & updatedAt
});
```

### Data Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Users Collection                     │
├─────────────────────────────────────────────────────────────┤
│ _id: ObjectId("507f1f77bcf86cd799439011")                   │
│ username: "john_doe"                                         │
│ password: "$2a$12$..." (hashed)                              │
│ role: "user"                                                 │
│ lastLogin: 2026-01-01T10:30:00Z                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Referenced by userId
                       │
        ┌──────────────┴──────────────┬──────────────┐
        │                             │              │
┌───────▼────────┐          ┌─────────▼───────┐  ┌──▼──────────┐
│ IOC Document 1 │          │ IOC Document 2  │  │ IOC Doc 3   │
├────────────────┤          ├─────────────────┤  ├─────────────┤
│ _id: "abc123"  │          │ _id: "def456"   │  │ _id: "ghi"  │
│ userId: "507f" │          │ userId: "507f"  │  │ userId:"507"│
│ username:      │          │ username:       │  │ username:   │
│  "john_doe"    │          │  "john_doe"     │  │  "john_doe" │
│ ioc:           │          │ ioc:            │  │ ioc:        │
│  "1.2.3.4"     │          │  "evil.com"     │  │  "bad.exe"  │
│ type: "ip"     │          │ type: "domain"  │  │ type: "hash"│
│ vt: {...}      │          │ vt: {...}       │  │ vt: {...}   │
└────────────────┘          └─────────────────┘  └─────────────┘
```

### Why This Design Is Secure and Scalable

✅ **Data Isolation:**
- Each IOC document contains `userId` field
- Queries automatically filter by authenticated user's ID
- Users cannot access other users' data without explicit sharing

✅ **Performance:**
- Indexed `userId` field enables fast queries
- Denormalized `username` avoids JOIN operations
- Compound indexes for complex queries

✅ **Scalability:**
- No foreign key constraints (NoSQL design)
- Horizontal scaling possible
- Sharding-ready architecture

✅ **Flexibility:**
- Optional public sharing via `isPublic` flag
- Soft deletion possible (just mark as deleted)
- Easy to add new fields without schema migration

---

## 6. Fetching Data for Specific Users

### Backend Query Pattern

```typescript
// Example: Fetch user's IOC history

export async function GET(request: NextRequest) {
  try {
    // ✅ STEP 1: Extract and verify token
    const token = getTokenFromRequest(request);
    if (!token) {
      return unauthorizedResponse();
    }

    const payload = verifyToken(token);
    if (!payload) {
      return unauthorizedResponse();
    }

    // ✅ STEP 2: Extract userId from token payload
    const userId = payload.userId;

    await connectDB();

    // ✅ STEP 3: Query ONLY user's data
    const userIOCs = await IOC.find({ 
      userId: userId  // ✅ CRITICAL: Filter by user
    })
    .sort({ fetchedAt: -1 })  // Newest first
    .limit(100);              // Pagination

    // ✅ STEP 4: Return filtered data
    return NextResponse.json({
      success: true,
      count: userIOCs.length,
      data: userIOCs
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
```

### How Data Leakage Is Prevented

```typescript
// ❌ INSECURE: Fetches ALL IOCs (data leakage!)
const allIOCs = await IOC.find({});

// ✅ SECURE: Fetches only user's IOCs
const userIOCs = await IOC.find({ userId: payload.userId });

// ✅ SECURE: With additional filters
const filteredIOCs = await IOC.find({
  userId: payload.userId,        // MUST ALWAYS BE PRESENT
  type: 'ip',
  'vt.normalized.verdict': 'malicious'
});

// ✅ SECURE: Aggregation with userId filter
const stats = await IOC.aggregate([
  { $match: { userId: payload.userId } },  // FIRST STAGE: Filter by user
  { $group: { _id: '$type', count: { $sum: 1 } } }
]);
```

### Dashboard Data Aggregation Example

```typescript
// src/app/api/dashboard/route.ts

export async function GET(request: NextRequest) {
  try {
    // Note: Dashboard shows aggregate stats (no userId filter)
    // This is intentional for system-wide statistics
    
    const stats = await IOC.aggregate([
      {
        $facet: {
          basicStats: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                malicious: {
                  $sum: {
                    $cond: [
                      { $eq: ["$vt.normalized.verdict", "malicious"] },
                      1,
                      0
                    ]
                  }
                }
              }
            }
          ],
          weeklyTrends: [
            {
              $match: {
                fetchedAt: { 
                  $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
                }
              }
            },
            {
              $group: {
                _id: { day: { $dayOfWeek: "$fetchedAt" } },
                threats: {
                  $sum: {
                    $cond: [
                      { $eq: ["$vt.normalized.verdict", "malicious"] },
                      1,
                      0
                    ]
                  }
                }
              }
            }
          ]
        }
      }
    ]);

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
```

---

## 7. IOC Scan Flow (Authenticated User)

### Complete Step-by-Step Flow

```
┌─────────────┐
│   Browser   │
│  (Client)   │
└──────┬──────┘
       │
       │ 1. User submits IOC (1.2.3.4)
       │    via Analyze page
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. Frontend validates & prepares request                     │
│    - Extract token from localStorage                         │
│    - Set Authorization header                                │
└──────┬───────────────────────────────────────────────────────┘
       │
       │ 3. POST /api/ioc
       │    Headers: { Authorization: "Bearer <JWT>" }
       │    Body: { iocs: ["1.2.3.4"], label: "Suspicious IP" }
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. Backend: Token Verification                               │
│    - Extract token from request                              │
│    - Verify signature & expiration                           │
│    - Extract userId from payload                             │
└──────┬───────────────────────────────────────────────────────┘
       │
       │ 5. Token valid → userId = "507f1f77bcf86cd799439011"
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│ 6. IOC Type Detection & Validation                           │
│    - Detect type: "1.2.3.4" → "ip"                          │
│    - Validate format (IPv4 regex)                            │
└──────┬───────────────────────────────────────────────────────┘
       │
       │ 7. Check cache (MongoDB)
       │    Find IOC where: { userId, ioc: "1.2.3.4" }
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│ 8a. Cache MISS → Fetch from External APIs                    │
└──────┬───────────────────────────────────────────────────────┘
       │
       ├─────────────► VirusTotal API
       │               GET /api/v3/ip_addresses/1.2.3.4
       │               Headers: { x-apikey: <VT_KEY> }
       │
       ├─────────────► AbuseIPDB API
       │               GET /api/v2/check?ipAddress=1.2.3.4
       │               Headers: { Key: <ABUSE_KEY> }
       │
       │ 9. Responses received
       │    - VT: { malicious: 5, harmless: 80, ... }
       │    - AbuseIPDB: { abuseConfidenceScore: 75, ... }
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│ 10. Data Processing & Risk Calculation                       │
│     - Normalize VT response                                  │
│     - Extract threat intelligence                            │
│     - Calculate unified risk score                           │
│     - Determine severity: "high" | "medium" | "low"         │
└──────┬───────────────────────────────────────────────────────┘
       │
       │ 11. Save to MongoDB with userId
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│ {                                                             │
│   userId: "507f1f77bcf86cd799439011",  ← User reference      │
│   username: "john_doe",                                       │
│   ioc: "1.2.3.4",                                            │
│   type: "ip",                                                │
│   label: "Suspicious IP",                                    │
│   vt: {                                                      │
│     normalized: {                                            │
│       verdict: "malicious",                                  │
│       stats: { malicious: 5, harmless: 80, ... }            │
│     }                                                        │
│   },                                                         │
│   threat_intel: {                                            │
│     severity: "high",                                        │
│     confidence: 85,                                          │
│     threatTypes: ["malware", "botnet"]                      │
│   },                                                         │
│   fetchedAt: "2026-01-01T10:30:00Z"                         │
│ }                                                            │
└──────┬───────────────────────────────────────────────────────┘
       │
       │ 12. Return analysis result to frontend
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│ {                                                             │
│   success: true,                                             │
│   results: [{                                                │
│     ioc: "1.2.3.4",                                          │
│     verdict: "malicious",                                    │
│     severity: "high",                                        │
│     detections: 5,                                           │
│     reputation: -75                                          │
│   }]                                                         │
│ }                                                            │
└──────┬───────────────────────────────────────────────────────┘
       │
       │ 13. Frontend displays results
       │     - Threat badge (red for malicious)
       │     - Detailed analysis card
       │     - Save to history
       │
       ▼
┌─────────────┐
│   Browser   │
│  (Client)   │
└─────────────┘
```

### Code Implementation

```typescript
// Frontend: Submitting IOC

async function analyzeIOC(ioc: string) {
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch('/api/ioc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`  // ✅ Include token
    },
    body: JSON.stringify({
      iocs: [ioc],
      label: 'My Analysis'
    })
  });
  
  const data = await response.json();
  return data.results[0];
}
```

```typescript
// Backend: Processing IOC

async function analyzeIOC(
  ioc: string, 
  label: string | undefined, 
  userId: string  // ✅ From JWT token
) {
  // 1. Check cache
  const cached = await IOC.findOne({ userId, ioc });
  if (cached && !isCacheExpired(cached)) {
    return formatResult(cached);
  }
  
  // 2. Fetch from external APIs
  const [vtResult, abuseResult] = await Promise.all([
    fetchVirusTotal(ioc),
    fetchAbuseIPDB(ioc)
  ]);
  
  // 3. Process & normalize data
  const normalized = normalizeVTResponse(vtResult);
  const threatIntel = extractThreatIntel(vtResult, abuseResult);
  
  // 4. Save to database with userId
  const iocDoc = await IOC.create({
    userId,          // ✅ CRITICAL: Associate with user
    username: username,  // From JWT payload
    ioc,
    type: detectIOCType(ioc),
    label,
    vt: { normalized, ...vtResult },
    threat_intel: threatIntel,
    fetchedAt: new Date()
  });
  
  return formatResult(iocDoc);
}
```

---

## 8. Security Best Practices Implemented

### ✅ Password Security

```typescript
// Bcrypt hashing with 12 salt rounds
const salt = await bcrypt.genSalt(12);
this.password = await bcrypt.hash(this.password, salt);

// Why 12 rounds?
// - 2^12 = 4,096 iterations
// - Takes ~250ms to hash (prevents brute force)
// - OWASP recommended minimum: 10 rounds
```

### ✅ Token Security

```typescript
// JWT stored in localStorage (not cookies)
// Why? Avoids CSRF attacks
localStorage.setItem('auth_token', token);

// Token transmitted via Authorization header
headers: {
  'Authorization': `Bearer ${token}`
}

// Why? More flexible than cookies, works with CORS
```

### ✅ Environment Variables

```bash
# .env.local (NEVER committed to Git)

JWT_SECRET=your-256-bit-secret-key-here-change-in-production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ioc_db
VIRUSTOTAL_API_KEY=your-vt-api-key
ABUSEIPDB_API_KEY=your-abuse-api-key
```

```typescript
// Accessing environment variables securely
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}
```

### ✅ Role-Based Access Control (RBAC)

```typescript
// Middleware checks admin role
if (payload.role !== 'admin') {
  return forbiddenResponse('Admin access required');
}

// User roles stored in JWT payload
const token = generateToken(userId, username, 'admin');
```

### ✅ Input Validation

```typescript
// Zod schema validation
const SubmitIOCRequestSchema = z.object({
  iocs: z.array(z.string().min(1).max(500)),
  label: z.string().optional()
});

const validation = SubmitIOCRequestSchema.safeParse(body);
if (!validation.success) {
  return NextResponse.json(
    { error: 'Invalid request', details: validation.error.errors },
    { status: 400 }
  );
}
```

### ✅ Rate Limiting (Recommended)

```typescript
// TODO: Implement with upstash/ratelimit or express-rate-limit

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m')  // 10 requests per minute
});

// In API route:
const identifier = payload.userId;
const { success } = await ratelimit.limit(identifier);

if (!success) {
  return NextResponse.json(
    { error: 'Too many requests' },
    { status: 429 }
  );
}
```

### ✅ HTTPS in Production

```typescript
// Next.js production configuration
module.exports = {
  // Force HTTPS redirects
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
        destination: 'https://yourdomain.com/:path*',
        permanent: true
      }
    ];
  }
};
```

### ✅ Database Query Protection

```typescript
// Always sanitize user input
const userInput = req.query.search;

// ❌ INSECURE: NoSQL injection possible
await IOC.find({ ioc: userInput });

// ✅ SECURE: Validate & sanitize
const validated = z.string().regex(/^[a-zA-Z0-9.-]+$/).parse(userInput);
await IOC.find({ ioc: validated, userId });
```

---

## 9. Common Auth Failure Scenarios

### Scenario 1: Token Expired

**Cause:** User tries to access API after 7 days

```javascript
// JWT verify fails with TokenExpiredError
jwt.verify(token, JWT_SECRET);
// Throws: TokenExpiredError: jwt expired
```

**Backend Response:**
```json
{
  "error": "Invalid or expired token",
  "status": 401
}
```

**Frontend Handling:**
```typescript
if (response.status === 401) {
  // Clear storage
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  
  // Redirect to login
  router.push('/login?error=session_expired');
}
```

---

### Scenario 2: Token Tampered

**Cause:** Attacker modifies JWT payload

```javascript
// Original token:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3NyIsInJvbGUiOiJ1c2VyIn0.signature

// Attacker changes "user" to "admin":
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3NyIsInJvbGUiOiJhZG1pbiJ9.signature

// jwt.verify() detects signature mismatch
```

**Backend Response:**
```json
{
  "error": "Invalid or expired token",
  "status": 401
}
```

---

### Scenario 3: User Deleted But Token Still Valid

**Cause:** Admin deletes user, but user still has valid token

**Solution: Token Blacklist (Recommended Enhancement)**

```typescript
// Check if user still exists
const user = await User.findById(payload.userId);
if (!user) {
  return NextResponse.json(
    { error: 'User account no longer exists' },
    { status: 401 }
  );
}
```

---

### Scenario 4: API Called Without Auth

**Cause:** Frontend bug or malicious request

```typescript
// Request without Authorization header
const token = getTokenFromRequest(request);
console.log(token);  // null
```

**Backend Response:**
```json
{
  "error": "Unauthorized",
  "status": 401
}
```

---

### Scenario 5: Non-Admin Accessing Admin Route

**Cause:** User tries to access `/api/admin/users`

```typescript
const payload = verifyToken(token);
// payload.role = "user"

if (payload.role !== 'admin') {
  return forbiddenResponse('Admin access required');
}
```

**Backend Response:**
```json
{
  "error": "Forbidden - Admin access required",
  "status": 403
}
```

---

### HTTP Status Code Reference

| Status | Meaning | Usage |
|--------|---------|-------|
| **401 Unauthorized** | Authentication required or failed | Missing token, invalid token, expired token |
| **403 Forbidden** | Authenticated but insufficient permissions | Non-admin accessing admin route |
| **400 Bad Request** | Invalid input data | Malformed JSON, validation errors |
| **500 Internal Server Error** | Server-side error | Database failure, API error |

---

## 10. Summary Flow (Plain English)

### How The Entire System Works

**Step 1: User Registration (Admin-Only)**

An administrator creates a new user account by running a backend script. The script:
- Takes a username and password
- Hashes the password using bcrypt (12 rounds)
- Saves the user to MongoDB with role "user"
- The password is **never** stored in plain text

**Step 2: User Login**

When a user wants to log in:
1. User enters username and password on the login page
2. Frontend sends these credentials to `/api/auth/login`
3. Backend finds the user in MongoDB by username
4. Backend compares the entered password with the hashed password using bcrypt
5. If passwords match, backend creates a JWT token containing:
   - User's database ID (userId)
   - Username
   - Role (user or admin)
   - Expiration time (7 days from now)
6. Backend sends the token back to the frontend
7. Frontend stores the token in localStorage
8. Frontend also stores user info (id, username, role) in localStorage

**Step 3: Making Authenticated Requests**

When the user wants to analyze an IOC:
1. Frontend reads the token from localStorage
2. Frontend sends a POST request to `/api/ioc` with:
   - The IOC to analyze in the request body
   - The token in the `Authorization: Bearer <token>` header
3. Backend receives the request and:
   - Extracts the token from the header
   - Verifies the token's signature (ensures it wasn't tampered with)
   - Checks the token's expiration date
   - Extracts the userId from the token's payload
4. If the token is valid, backend proceeds with the IOC analysis
5. If the token is invalid, expired, or missing, backend returns a 401 error

**Step 4: Analyzing and Storing IOCs**

After authentication succeeds:
1. Backend detects the IOC type (IP, domain, URL, or hash)
2. Backend checks if this IOC was already analyzed by this user (cache check)
3. If not cached or cache expired:
   - Backend calls VirusTotal API to get malware analysis
   - Backend calls AbuseIPDB API for IP reputation (if it's an IP)
   - Backend waits for both responses
4. Backend processes the responses:
   - Normalizes the data into a consistent format
   - Calculates a unified risk score
   - Determines threat severity (critical, high, medium, low)
5. Backend saves a new IOC document to MongoDB with:
   - **userId** (from the JWT token) - this is CRITICAL
   - username (from the JWT token)
   - The IOC value
   - All analysis results
   - Timestamp
6. Backend returns the analysis results to the frontend

**Step 5: Fetching User's History**

When a user wants to see their IOC history:
1. Frontend sends a GET request to `/api/history` with the token
2. Backend verifies the token and extracts userId
3. Backend queries MongoDB: `IOC.find({ userId: userId })`
   - This query ONLY returns IOCs that belong to this user
   - Other users' IOCs are completely invisible
4. Backend returns the user's IOC history
5. Frontend displays the history in a table

**Step 6: Dashboard Statistics**

The dashboard shows aggregate statistics:
1. Frontend sends a GET request to `/api/dashboard` with the token
2. Backend verifies authentication (but doesn't filter by userId for stats)
3. Backend runs complex MongoDB aggregation queries:
   - Count total malicious vs clean IOCs
   - Group by day of week for trend charts
   - Count IOCs by type (IP, domain, URL, hash)
   - Calculate geographic distribution
4. Backend returns the statistics
5. Frontend displays charts and graphs

**Step 7: Admin Operations**

When an admin wants to manage users:
1. Frontend sends a request to `/api/admin/users` with the token
2. Backend verifies the token
3. Backend checks if `payload.role === 'admin'`
4. If the user is an admin, backend allows the operation
5. If the user is NOT an admin, backend returns a 403 Forbidden error

**Step 8: Logout**

When a user logs out:
1. Frontend optionally notifies the backend (for audit logs)
2. Frontend removes the token from localStorage
3. Frontend removes user info from localStorage
4. Frontend redirects to the login page
5. Since the token is gone, all future requests will fail authentication

---

### Key Security Principles

**1. Zero Trust:**
- Every API request is treated as untrusted
- Every request MUST include a valid token
- The backend NEVER assumes the client is telling the truth

**2. Data Isolation:**
- Users can only see their own IOCs
- The userId from the token is the source of truth
- Even if a user modifies the frontend code, they can't access other users' data

**3. Stateless Authentication:**
- No session storage on the server
- Token contains all necessary information
- Server doesn't track "logged in" users
- This allows horizontal scaling

**4. Defense in Depth:**
- Multiple layers of security:
  - Middleware protects routes
  - API routes verify tokens
  - Database queries filter by userId
  - Input validation prevents injection attacks

---

## 11. Optional Enhancements

### 1. OAuth Integration (Google/GitHub)

```typescript
// Using NextAuth.js for OAuth

import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Create user in MongoDB if doesn't exist
      const existingUser = await User.findOne({ email: user.email });
      if (!existingUser) {
        await User.create({
          username: user.email,
          email: user.email,
          role: 'user',
          oauthProvider: account.provider,
          oauthId: account.providerAccountId
        });
      }
      return true;
    }
  }
};
```

**Benefits:**
- ✅ No password management
- ✅ Users trust familiar login methods
- ✅ Faster onboarding

---

### 2. Refresh Token Strategy

```typescript
// Generate access token (short-lived) and refresh token (long-lived)

export function generateTokenPair(userId: string, username: string, role: string) {
  const accessToken = jwt.sign(
    { userId, username, role },
    JWT_SECRET,
    { expiresIn: '15m' }  // ✅ Short-lived
  );
  
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    REFRESH_SECRET,
    { expiresIn: '30d' }  // ✅ Long-lived
  );
  
  return { accessToken, refreshToken };
}

// Refresh endpoint
export async function POST(req: NextRequest) {
  const { refreshToken } = await req.json();
  
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    return unauthorizedResponse();
  }
  
  // Generate new access token
  const user = await User.findById(payload.userId);
  const newAccessToken = generateToken(user._id, user.username, user.role);
  
  return NextResponse.json({ accessToken: newAccessToken });
}
```

**Benefits:**
- ✅ Shorter access token lifespan (15 min) = more secure
- ✅ If access token stolen, expires quickly
- ✅ Refresh token stored securely (HTTP-only cookie)

---

### 3. Enhanced RBAC (Role-Based Access Control)

```typescript
// Multiple roles with granular permissions

enum Permission {
  READ_IOC = 'read:ioc',
  WRITE_IOC = 'write:ioc',
  DELETE_IOC = 'delete:ioc',
  READ_USERS = 'read:users',
  WRITE_USERS = 'write:users',
  MANAGE_SYSTEM = 'manage:system'
}

interface Role {
  name: string;
  permissions: Permission[];
}

const roles: Record<string, Role> = {
  user: {
    name: 'user',
    permissions: [
      Permission.READ_IOC,
      Permission.WRITE_IOC
    ]
  },
  analyst: {
    name: 'analyst',
    permissions: [
      Permission.READ_IOC,
      Permission.WRITE_IOC,
      Permission.DELETE_IOC
    ]
  },
  admin: {
    name: 'admin',
    permissions: Object.values(Permission)  // All permissions
  }
};

// Permission check middleware
function requirePermission(permission: Permission) {
  return async (req: NextRequest) => {
    const payload = await verifyAuth(req);
    if (!payload) return unauthorizedResponse();
    
    const userRole = roles[payload.role];
    if (!userRole.permissions.includes(permission)) {
      return forbiddenResponse('Insufficient permissions');
    }
    
    return NextResponse.next();
  };
}
```

---

### 4. Audit Logging

```typescript
// Track all user actions

interface AuditLog {
  userId: string;
  username: string;
  action: string;
  resource: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
  status: 'success' | 'failure';
  details?: any;
}

const AuditLogSchema = new Schema<AuditLog>({
  userId: { type: String, required: true, index: true },
  username: { type: String, required: true },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  ip: { type: String, required: true },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now, index: true },
  status: { type: String, enum: ['success', 'failure'] },
  details: { type: Schema.Types.Mixed }
});

// Usage in API routes
async function logAction(
  userId: string,
  action: string,
  resource: string,
  req: NextRequest
) {
  await AuditLog.create({
    userId,
    username: payload.username,
    action,
    resource,
    ip: req.ip || req.headers.get('x-forwarded-for'),
    userAgent: req.headers.get('user-agent'),
    status: 'success'
  });
}

// In IOC analysis route:
await logAction(payload.userId, 'ANALYZE_IOC', ioc, req);
```

**Benefits:**
- ✅ Compliance (GDPR, HIPAA, SOC 2)
- ✅ Forensics (investigate security incidents)
- ✅ User activity monitoring

---

### 5. Device/Session Tracking

```typescript
// Track active sessions per user

interface Session {
  userId: string;
  sessionId: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
    location?: string;
  };
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
}

// On login, create session
const sessionId = uuidv4();
await Session.create({
  userId: user._id,
  sessionId,
  deviceInfo: {
    userAgent: req.headers.get('user-agent'),
    ip: req.ip
  },
  createdAt: new Date(),
  lastActivity: new Date(),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
});

// User can view active sessions and revoke them
export async function GET(req: NextRequest) {
  const payload = await verifyAuth(req);
  const sessions = await Session.find({ 
    userId: payload.userId,
    expiresAt: { $gt: new Date() }
  });
  
  return NextResponse.json({ sessions });
}

// Revoke session
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = await verifyAuth(req);
  await Session.deleteOne({ 
    _id: params.id, 
    userId: payload.userId  // ✅ Only delete own sessions
  });
  
  return NextResponse.json({ success: true });
}
```

---

### 6. Two-Factor Authentication (2FA)

```typescript
// TOTP (Time-based One-Time Password)

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

// Generate 2FA secret
export async function POST(req: NextRequest) {
  const payload = await verifyAuth(req);
  
  const secret = speakeasy.generateSecret({
    name: `IOC Platform (${payload.username})`
  });
  
  // Save secret to user
  await User.findByIdAndUpdate(payload.userId, {
    twoFactorSecret: secret.base32,
    twoFactorEnabled: false  // Not enabled until verified
  });
  
  // Generate QR code for user to scan
  const qrCode = await QRCode.toDataURL(secret.otpauth_url);
  
  return NextResponse.json({ qrCode, secret: secret.base32 });
}

// Verify 2FA token during login
const token = req.body.twoFactorToken;
const user = await User.findOne({ username }).select('+twoFactorSecret');

if (user.twoFactorEnabled) {
  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token
  });
  
  if (!verified) {
    return NextResponse.json(
      { error: 'Invalid 2FA code' },
      { status: 401 }
    );
  }
}
```

---

## Conclusion

This document provides a complete technical overview of the authentication and data flow architecture in the IOC Threat Intelligence Platform. The system implements:

✅ **Secure JWT-based authentication**  
✅ **User-isolated data storage**  
✅ **Role-based access control**  
✅ **Production-grade security practices**  
✅ **Scalable MongoDB architecture**  

For questions or security concerns, contact the engineering team.

---

**Document Version:** 1.0  
**Last Updated:** January 1, 2026  
**Maintained By:** Security Engineering Team
