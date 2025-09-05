import Image from "next/image";

export default function Home() {
  const envVars: Record<string, string | undefined> = {
    API_URL: process.env.API_URL,
    API_URL3: process.env.API_URL3,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_URL2: process.env.NEXTAUTH_URL2,
    SECRET_KEY: process.env.SECRET_KEY,
    MONGODB_URI: process.env.MONGODB_URI,
    NODEMAILER_SERVICE: process.env.NODEMAILER_SERVICE,
    NODEMAILER_EMAIL: process.env.NODEMAILER_EMAIL,
    NODEMAILER_PASS: process.env.NODEMAILER_PASS,
    GITHUB_ID: process.env.GITHUB_ID,
    GITHUB_SECRET: process.env.GITHUB_SECRET,
    GITHUB_PAT_ID: process.env.GITHUB_PAT_ID,
    GITHUB_PAT_SECRET: process.env.GITHUB_PAT_SECRET,
    GITHUB_PAT_REDIRECT_URI: process.env.GITHUB_PAT_REDIRECT_URI,
    AZURE_CLIENT_ID: process.env.AZURE_CLIENT_ID,
    AZURE_TENANT_ID: process.env.AZURE_TENANT_ID,
    NEXTJS_SP_ENTITY_ID: process.env.NEXTJS_SP_ENTITY_ID,
    NEXTJS_SP_ACS_URL: process.env.NEXTJS_SP_ACS_URL,
    NEXTJS_SP_SLS_URL: process.env.NEXTJS_SP_SLS_URL,
    NEXTJS_SP_CERT_PATH: process.env.NEXTJS_SP_CERT_PATH,
    NEXTJS_SP_PRIVATE_KEY_PATH: process.env.NEXTJS_SP_PRIVATE_KEY_PATH,
    NEXT_PUBLIC_REDIRECT_URL: process.env.NEXT_PUBLIC_REDIRECT_URL,
    GOOGLE_SECRET_MANAGER_PROJECT: process.env.GOOGLE_SECRET_MANAGER_PROJECT,
    GCP_PROJECT_ID: process.env.GCP_PROJECT_ID,
    AZURE_SECRET_NAME: process.env.AZURE_SECRET_NAME,
    DESCOPE_PROJECT_ID2: process.env.DESCOPE_PROJECT_ID2,
    DESCOPE_CLIENT_SECRET2: process.env.DESCOPE_CLIENT_SECRET2,
    DESCOPE_BASE_URL: process.env.DESCOPE_BASE_URL,
    DESCOPE_API_URL: process.env.DESCOPE_API_URL,
    DESCOPE_SAML_URL: process.env.DESCOPE_SAML_URL,
    MONGODB_URI3: process.env.MONGODB_URI3,
    MONGODB_URI6: process.env.MONGODB_URI6,
    MONGODB_URI23: process.env.MONGODB_URI23,
    MONGODB_URI33: process.env.MONGODB_URI33,
    AZURE_CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET,
    DESCOPE_PROJECT_ID: process.env.DESCOPE_PROJECT_ID,
    DESCOPE_CLIENT_SECRET: process.env.DESCOPE_CLIENT_SECRET,
    NEXT_PUBLIC_CW_LOGIN_URL: process.env.NEXT_PUBLIC_CW_LOGIN_URL,
    NEXT_PUBLIC_CW_APP_URL: process.env.NEXT_PUBLIC_CW_APP_URL,
    NEXT_PUBLIC_CW_DOMAIN: process.env.NEXT_PUBLIC_CW_DOMAIN,
    GOOGLE_CLIENTID: process.env.GOOGLE_CLIENTID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    OKTA_CLIENTID: process.env.OKTA_CLIENTID,
    OKTA_CLIENT_SECRET: process.env.OKTA_CLIENT_SECRET,
    OKTA_ISSUER: process.env.OKTA_ISSUER,
    OKTA_ISSUER_NEXT_AUTH: process.env.OKTA_ISSUER_NEXT_AUTH,
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          🌍 Environment Variables
        </h1>

        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-4 py-2 font-semibold text-gray-700">
                  Key
                </th>
                <th className="text-left px-4 py-2 font-semibold text-gray-700">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(envVars).map(([key, value], idx) => (
                <tr
                  key={key}
                  className={`${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-gray-100`}
                >
                  <td className="px-4 py-2 font-mono text-xs text-gray-600">
                    {key}
                  </td>
                  <td className="px-4 py-2 text-gray-800 break-all">
                    {value || <span className="text-gray-400">Not Set</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
