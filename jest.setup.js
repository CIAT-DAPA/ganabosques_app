// DOM matchers (toBeInTheDocument, toHaveTextContent, ...).
import "@testing-library/jest-dom";
import { configure } from "@testing-library/react";

// The default 1s is too tight for the page suites under parallel load
configure({ asyncUtilTimeout: 5000 });
