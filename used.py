import subprocess

def run_ollama(prompt, model="deepseek-r1:1.5b"):
    try:

        process = subprocess.run(
            ["ollama", "run", model],
            input=prompt.encode(),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        output = process.stdout.decode("utf-8")
        error = process.stderr.decode("utf-8")

        if process.returncode != 0:
            return f"Error running Ollama:\n{error}"
        return output.strip()

    except FileNotFoundError:
        return "Ollama is not installed or not found in PATH."
    except Exception as e:
        return f"Unexpected error: {str(e)}"

if __name__ == "__main__":
    while True:
        prompt = input("Prompt :- ")
        if prompt!="Exit":
            response = run_ollama(prompt)
            print("Ollama Response:\n", response)
        else:
            break