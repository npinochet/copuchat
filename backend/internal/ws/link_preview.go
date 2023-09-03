package ws

import (
	"bytes"
	"copuchat/internal/redis"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"strings"

	"github.com/dyatlov/go-opengraph/opengraph"
	"golang.org/x/net/html"
	"golang.org/x/net/html/atom"
)

const cacheKeyPrefix = "cache:"

func LinkPreviewGraph(rawURL string, hub *Hub, userName string) (*opengraph.OpenGraph, error) {
	url, err := parseURL(rawURL)
	if err != nil {
		return nil, err
	}
	var graph *opengraph.OpenGraph
	cacheKey := cacheKeyPrefix + url

	data, err := redis.Get(cacheKey)
	if err != nil && !errors.Is(err, redis.ErrNil) {
		return nil, err
	}
	if err == nil {
		if err := json.Unmarshal(data, &graph); err != nil {
			return nil, err
		}
	}
	if errors.Is(err, redis.ErrNil) {
		hub.Lock()
		remoteAddr := hub.Conns[userName].Request().RemoteAddr
		hub.Unlock()
		if graph, err = fetchOpenGraph(url, remoteAddr); err != nil {
			return nil, err
		}
		data, err := graph.ToJSON()
		if err != nil {
			return nil, err
		}
		if err := redis.SetPX(cacheKey, data, cacheExpirationTime); err != nil {
			return nil, err
		}
	}

	return graph, nil
}

func parseURL(rawURL string) (string, error) {
	parsed, err := url.Parse(rawURL)
	if err != nil {
		return "", err
	}
	if parsed.Scheme == "" {
		parsed.Scheme = "https"
	}
	if parsed.Scheme != "https" && parsed.Scheme != "http" {
		return "", fmt.Errorf("preview: scheme %s for %s not supported", parsed.Scheme, parsed)
	}

	return parsed.String(), nil
}

func fetchOpenGraph(url string, remoteAddr string) (*opengraph.OpenGraph, error) {
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	if clientIP, _, err := net.SplitHostPort(remoteAddr); err == nil {
		req.Header.Set("X-Forwarded-For", clientIP)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	graph := opengraph.NewOpenGraph()
	if err := graph.ProcessHTML(bytes.NewReader(body)); err != nil {
		return nil, err
	}
	if graph.URL == "" {
		graph.ProcessMeta(map[string]string{"property": "og:url", "content": url})
	}
	if graph.Title == "" && graph.Images == nil {
		title, iconURL := extractTitleAndIconURL(body)
		if title != "" {
			graph.ProcessMeta(map[string]string{"property": "og:title", "content": title})
		}
		if iconURL != "" {
			graph.ProcessMeta(map[string]string{"property": "og:image", "content": iconURL})
		}
	}

	return graph, nil
}

func extractTitleAndIconURL(body []byte) (string, string) {
	title, icon := "", ""
	tokenizer := html.NewTokenizer(bytes.NewReader(body))
	for {
		tt := tokenizer.Next()
		if tt == html.ErrorToken {
			break
		}
		if tt == html.StartTagToken || tt == html.SelfClosingTagToken {
			name, hasAttr := tokenizer.TagName()
			atomName := atom.Lookup(name)
			if atomName == atom.Title {
				tokenizer.Next()
				title = strings.TrimSpace(tokenizer.Token().Data)

				continue
			}
			if atomName == atom.Link {
				var key, val []byte
				attrs := map[string]string{}
				for hasAttr {
					key, val, hasAttr = tokenizer.TagAttr()
					attrs[atom.String(key)] = string(val)
				}
				if strings.ContainsAny(attrs["link"], "icon") {
					icon = attrs["href"]
				}
			}
		}
		if title != "" && icon != "" {
			break
		}
	}

	return title, icon
}
