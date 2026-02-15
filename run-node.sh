#!/bin/bash
# Adapted from alfy's run-node.sh (MIT License)
# https://github.com/sindresorhus/alfy

# Allow overriding node path via workflow variable
if [[ -n "$NODE_PATH_OVERRIDE" ]]; then
	PATH="$NODE_PATH_OVERRIDE:$PATH"
fi

if [[ -z "$alfred_workflow_cache" ]]; then
	echo '{"items":[{"title":"Missing Bundle ID","subtitle":"Set a Bundle ID in the workflow configuration","valid":false}]}'
	exit 1
fi

if [[ ! -d "$alfred_workflow_cache" ]]; then
	mkdir -p "$alfred_workflow_cache"
fi

PATH_CACHE="$alfred_workflow_cache/node_path"

get_user_path() {
	eval $(/usr/libexec/path_helper -s)

	local delimiter="_SEERR_ENV_DELIMITER_"
	local raw_env
	raw_env="$(DISABLE_AUTO_UPDATE=true ZSH_TMUX_AUTOSTARTED=true ZSH_TMUX_AUTOSTART=false $SHELL -ilc "echo -n $delimiter; command env; echo -n $delimiter; exit" 2>/dev/null)"

	local env_output="${raw_env#*"$delimiter"}"
	env_output="${env_output%%"$delimiter"*}"

	local user_path
	user_path="$(echo "$env_output" | sed -n 's/^PATH=//p')"

	if [[ -n "$user_path" ]]; then
		echo "PATH=\"${user_path}:\$PATH\"" > "$PATH_CACHE"
	fi
}

set_path() {
	if [[ -f "$PATH_CACHE" ]]; then
		. "$PATH_CACHE"
	else
		get_user_path
		if [[ -f "$PATH_CACHE" ]]; then
			. "$PATH_CACHE"
		fi
	fi

	export PATH
}

has_node() {
	command -v node >/dev/null 2>&1
}

if ! has_node; then
	set_path

	if ! has_node; then
		rm -f "$PATH_CACHE"
		set_path
	fi
fi

if has_node; then
	node "$@"
else
	echo '{"items":[{"title":"Couldn'\''t find the `node` binary","subtitle":"Set NODE_PATH_OVERRIDE in the workflow configuration or install Node.js","valid":false}]}'
fi
