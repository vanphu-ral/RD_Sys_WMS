
from keycloak import KeycloakOpenID
from app.core.config import settings


def get_keycloak_openid():
    return KeycloakOpenID(
        server_url=settings.KEYCLOAK_URL,
        client_id=settings.KEYCLOAK_CLIENT_ID,
        realm_name=settings.KEYCLOAK_REALM,
        client_secret_key=settings.KEYCLOAK_CLIENT_SECRET,
        verify=False  # Disable SSL verification for development
    )


def get_well_known_openid_configuration():
    try:
        keycloak_openid = get_keycloak_openid()
        return keycloak_openid.well_known()
    except Exception as e:
        print(f"Keycloak well-known config error: {e}")
        return {
            "authorization_endpoint": f"{settings.KEYCLOAK_URL}/realms/{settings.KEYCLOAK_REALM}/protocol/openid-connect/auth",
            "token_endpoint": f"{settings.KEYCLOAK_URL}/realms/{settings.KEYCLOAK_REALM}/protocol/openid-connect/token",
            "userinfo_endpoint": f"{settings.KEYCLOAK_URL}/realms/{settings.KEYCLOAK_REALM}/protocol/openid-connect/userinfo",
            "end_session_endpoint": f"{settings.KEYCLOAK_URL}/realms/{settings.KEYCLOAK_REALM}/protocol/openid-connect/logout"
        }


def get_authorization_url():

    try:
        keycloak_openid = get_keycloak_openid()
        return keycloak_openid.auth_url(
            redirect_uri=settings.KEYCLOAK_REDIRECT_URI,
            scope="openid profile email",
            state="random_state_string"
        )
    except Exception as e:
        print(f"Keycloak connection error: {e}")
        # Fallback to manual URL construction
        auth_url = f"{settings.KEYCLOAK_URL}/realms/{settings.KEYCLOAK_REALM}/protocol/openid-connect/auth"
        params = {
            "client_id": settings.KEYCLOAK_CLIENT_ID,
            "redirect_uri": settings.KEYCLOAK_REDIRECT_URI,
            "scope": "openid profile email",
            "response_type": "code",
            "state": "random_state_string"
        }
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"{auth_url}?{query_string}"


def exchange_code_for_token(code: str):
    keycloak_openid = get_keycloak_openid()
    return keycloak_openid.token(
        grant_type="authorization_code",
        code=code,
        redirect_uri=settings.KEYCLOAK_REDIRECT_URI
    )


def refresh_token(refresh_token: str):
    keycloak_openid = get_keycloak_openid()
    return keycloak_openid.refresh_token(refresh_token)


def get_user_info(access_token: str):
    keycloak_openid = get_keycloak_openid()
    return keycloak_openid.userinfo(access_token)


def logout_user(refresh_token: str):
    keycloak_openid = get_keycloak_openid()
    return keycloak_openid.logout(refresh_token)