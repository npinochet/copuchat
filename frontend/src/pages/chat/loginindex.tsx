import { client } from "../../data/pb";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Auth() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const login = async () => {
    try {
      const userData = await client
        .collection("users")
        .authWithPassword(username, password);
      navigate("/app");
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return {
    /*
    <Container size={420} my={40}>
      <Title align="center">Welcome back!</Title>
      <Text color="dimmed" size="sm" align="center" mt={5}>
        Do not have an account yet?{" "}
        <Anchor size="sm" component="button">
          Create account
        </Anchor>
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <TextInput
          onChange={(event) => setUsername(event.currentTarget.value)}
          label="Email"
          placeholder="you@mantine.dev"
          required
        />
        <PasswordInput
          onChange={(event) => setPassword(event.currentTarget.value)}
          label="Password"
          placeholder="Your password"
          required
          mt="md"
        />
        <Group position="apart" mt="lg">
          <Checkbox label="Remember me" />
          <Anchor component="button" size="sm">
            Forgot password?
          </Anchor>
        </Group>
        <Button onClick={login} fullWidth mt="xl">
          Sign in
        </Button>
        {error && (
          <Notification
            mt="lg"
            icon={<IconX size="1.1rem" />}
            color="red"
            withCloseButton={false}
          >
            {error}
          </Notification>
        )}
      </Paper>
    </Container>
   */
  };
}

export default Auth;
